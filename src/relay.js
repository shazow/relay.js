/**
 * @author Andrey Petrov (andrey.petrov@shazow.net)
 */

(function(window) {

    var Command = function(data, sep) {
        this.sep = sep || ' ';
        this.data = data;
    }
    Command.prototype = {
        pop: function() {
            var i = this.data.indexOf(this.sep);
            var cmd = this.data.slice(0, i);
            this.data = this.data.slice(i+1);
            return cmd;
        }
    }

    /**
     * Create a Relay interface on a given socket to a relay hub.
     * @param {socket} socket A socket.io-like socket (websocket).
     */
    var Relay = window.Relay = function(socket, logger) {
        this.channel = null;
        this.user_id = null;
        this.socket = socket;
        this.logger = logger || function() {};

        var self = this;
        socket.connect();
        socket.on('message', function(data) {
            self.receive(data);
        });
    }

    Relay.prototype = {
        /**
         * Create a channel.
         * @param {function} code Client payload that will be executed by users who join.
         */
        create: function(code) {
            this.send('create ' + code);
        },

        /**
         * Join a channel.
         * @param {string} id Name of channel to join.
         */
        join: function(id) {
            this.channel = id;
            this.send('join ' + id);
        },

        /**
         * Set handler for a received command.
         * @param {string} command Name of command to handle (first word of received message from relay).
         * @param {function} fn Function to execute with the rest of the command as an argument.
         */
        on: function(command, fn) {
            this._commands[command] = fn;
        },

        receive: function(data) {
            this.logger(data, 'receive');

            var cmd = new Command(data);
            var operator = cmd.pop();
            var fn = this._commands[operator];
            if(fn) return fn.call(this, cmd);
        },
        send: function(data) {
            this.logger(data, 'send');

            this.socket.send(data);
        },

        _commands: {
            id: function(cmd) {
                this.user_id = cmd.data;
            },
            created: function(cmd) {
                this.channel = cmd.data;
            },
            code: function(cmd) {
                // TODO: Prompt for permission to eval foreign code.
                eval('(' + cmd.data + ')();');
            }
        }
    }

})(window);
