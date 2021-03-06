# What if you could host a server in your browser?

Relay.js allows you to establish a one-to-many channel of communication from the comfort of your browser.
It uses [Socket.IO](http://socket.io/) to establish a websocket from your browser to the relay hub, and from the other users to the relay hub.

Want to skip to the juice and try it? **[Go here to make a whiteboard app channel](http://relayjs.com/apps/whiteboard-no_debug.html)** ([Source](https://github.com/shazow/relay.js/blob/master/examples/apps/whiteboard-no_debug.html)).

## How it works

1. You open some HTML with the relay.js library and open a websocket to a relay hub. You can host your own hub, or use a public one:

        <script src="http://cdn.socket.io/stable/socket.io.js"></script>
        <script src="https://github.com/shazow/relay.js/raw/master/src/relay.js"></script>
        <script type="text/javascript">
            // Open a socket to a hub using socket.io
            var socket = new io.Socket('hub.relayjs.com', {port: 8080});

            // Connect to the relay using the socket
            var relay = new Relay(socket);
        </script>

2. Create a channel on the relay hub with a client logic payload:

        relay.create(function() {
            alert('Hello World.');
        });

3. Open your HTML in your browser to execute the code. When the channel is ready, the `relay.channel` variable will contain the channel id. Now you can invite people to join your relay channel using any compatible client, or use the example one provided here:

        http://relayjs.com/client/#!/<channel id>

4. When somebody connects to your channel, your browser will get `joined` message with the user id. The person who joined will receive the client logic payload you defined earlier and execute it. They should see a "Hello World" alert pop up.


## Relay.js Hub API

There is an example implementation of a Relay.js hub using node.js under [examples/hubs/nodejs](https://github.com/shazow/relay.js/tree/master/examples/hubs/nodejs).

### Receives: Relay Commands

* `create <code>`: Create a channel.
* `join <channel id>`: Join a channel.

### Receives: Channel commands

* `msg <from> <to> <message>`: Send a message to the channel. `from` is your user id and `to` is either the target user id or one of `all`, `op`, `users`.
  *(Note: The `from` field will probably go away soon.)*

### Sends (to the Relay.js Client)

The authoratative client implementation lives in [src/relay.js](https://github.com/shazow/relay.js/blob/master/src/relay.js).

* `id <user id>`: Your user id, received upon connecting.
* `error <message>`: Error message.
* `code <code>`: (When joining) Client code sent by the channel operator, should be executed.
* `destroyed`: (When joining) Channel is destroyed because the operator left.
* `created <channel id>`: (When creating) Channel id of the created channel.
* `joined <user id>`: (When creating) User joined your channel.
* `leaving <user id>`: (When creating) User leaving your channel.
* `msg <from> <to> <message>`: Received a message from the channel from user id `from` to target `to` (one of `all`, `op`, `users`, or your user id).

You can build more command logic on top of the `msg` command.


## What can you use this for?

See the [examples](https://github.com/shazow/relay.js/tree/master/examples) directory.

* Chat
* Collaborative whiteboard
* (Soon) Map-reduce cluster
* (Soon) 1v1 board game (chess?)
* (Someday) MMORPG with channel portals

## TODO

* Prompt user before executing the client logic from the operator.
* Everything else.
