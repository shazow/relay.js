var fs = require('fs');
var http = require('http');
var util = require('util');

var io = require('socket.io');


var content = fs.readFileSync(__dirname + '/static/index.html');

var server = http.createServer(function(req, res){
    res.writeHeader(200, {'Content-Type': 'text/html'}); 
    res.write(content);
    res.end();
});
server.listen(8000);



var Command = function(msg) {
    this.msg = msg;
}
Command.prototype = {
    pop: function() {
        var i = this.msg.indexOf(' ');
        var cmd = this.msg.slice(0, i);
        this.msg = this.msg.slice(i+1);
        return cmd;
    }
}



var Channel = function(op, code) {
    this.id = Channel.num++;
    this.op = op;
    this.users = {};
    this.code = code;
}
Channel.num = 0;
Channel.prototype = {
    join: function(client) {
        this.users[client.id] = client;
        client.send('code ' + this.payload);
    },
    leave: function(client) {
        if(this.op != client) {
            this.send_op(client, 'leaving', 'op');
            delete this.users[client.id];
            return;
        }
        this.send_users(client, 'destroyed', 'all');
        this.users = {};
        delete Relay.channels[this.id];
    },

    send: function(client, msg, to_id) {
        var u = this.users[to_id];
        u.send('msg ' + client.id + ' ' + to_id + ' ' + msg);
    },
    send_op: function(client, msg, to_id) {
        var to_id = to_id || 'all';

        this.op.send('msg ' + client.id + ' ' + to_id + ' ' + msg);
    },
    send_users: function(client, msg, to_id) {
        var to_id = to_id || 'all';

        for(var id in this.users) {
            if(client.id==id) continue;

            var u = this.users[id];
            u.send('msg ' + client.id + ' ' + to_id + ' ' + msg);
        }
    },
    send_all: function(client, msg, to_id) {
        var to_id = to_id || 'all';

        this.send_op(client, to_id, msg);
        this.send_users(client, to_id, msg);
    },

    receive: function(client, s) {
        var cmd = new Command(s);
        var operator = cmd.pop();
        this.commands[operator](client, cmd);
    },

    commands: {
        msg: function(client, cmd) {
            var from_id = cmd.pop();
            if(from_id != client.id) {
                util.log('Forged message from ' + client.id + ' pretending to be ' + from_id + ': ' + cmd.msg);
                return;
            }

            // TODO: More permission checking (users can't send to users, only all or op, etc.)

            var to_id = cmd.pop();
            switch(to_id) {
                case 'op':
                    this.send_op(client, cmd.msg, to_id);
                    break;
                case 'users':
                    this.send_users(client, cmd.msg, to_id);
                    break;
                case 'all':
                    this.send_all(client, cmd.msg, to_id);
                    break;
                default:
                    this.send(client, cmd.msg, to_id);
            }


        }
    }
}

var Relay = {
    channels: {},
    receive: function(client, s) {
        var cmd = new Command(s);
        var operator = cmd.pop();
        return Relay.commands[operator](client, cmd);
    },
    commands: {
        create: function(client, payload) {
            var ch = new Channel(client);
            Relay.channels[ch.id] = ch;
            return ch;
        },
        join: function(client, channel_id) {
            var ch = Relay.channels[ch.id];
            ch.join(client);
            return ch;
        }
    }
}


var socket = io.listen(server);
socket.on('connection', function(client) {
    var channel;
    client.on('message', function(data) {
        if(channel) {
            channel.receive(client, data);
            return;
        }
        channel = Relay.receive(client, data);
    });
    client.on('disconnect', function() {
        if(channel) {
            channel.leave(client);
        }
    });
});
