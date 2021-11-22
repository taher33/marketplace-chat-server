const { handleError } = require("../utils/errors");

exports.signUp = (io, socket, client) => {
  // const signup = async (payload, cb) => {
  //   const { user } = payload;
  //   if (!user) return cb({ error: "must specify a user" });
  //   try {
  //     client.sadd(
  //       "users",
  //       JSON.stringify({
  //         user,
  //       })
  //     );

  //     const usersString = await client.smembers("users");
  //     let users = usersString.map((user) => JSON.parse(user));
  //     io.emit("user connecting", users);

  //     console.log("sign up");
  //   } catch (err) {
  //     const error = handleError(err);
  //     console.log(error);
  //     cb({ error });
  //   }
  // };
  // const login = async (payload, cb) => {
  //   const { user } = payload;
  //   if (!user) return cb({ error: "must specify a user" });

  //   try {
  //     client.sadd(
  //       "users",
  //       JSON.stringify({
  //         user,
  //       })
  //     );
  //     console.log("login success");
  //   } catch (err) {
  //     const error = handleError(err);
  //     cb({ error });
  //   }
  // };
  const setConnectedUsers = async (payload, cb) => {
    try {
      const { user } = payload;
      const ConnectedUser = JSON.stringify(user);
      const usersString = await client.smembers("users");
      let users = usersString
        .map((user) => JSON.parse(user))
        .filter((el) => el._id === user._id);
      if (!users[0]) {
        await client.sadd("users", ConnectedUser);
      }
      cb({ status: "success" });
      socket.join(user._id);
    } catch (err) {
      console.log(err);
      const error = handleError(err);
      cb({ status: "error", error });
    }
  };

  const getConnectedUsers = async (payload, cb) => {
    try {
      const usersString = await client.smembers("users");
      let users = usersString
        .map((user) => JSON.parse(user))
        .filter((el) => el._id !== payload._id);
      cb({ status: "success", users });
    } catch (err) {
      const error = handleError(err);
      cb({ status: "error", error });
    }
  };

  const onDisconnect = async () => {
    //!this needs work
    console.log("disconnect");
    // try {
    //   const user = JSON.stringify({
    //     name: socket.user.data.name,
    //     email: socket.user.data.email,
    //     id: socket.user.data.id,
    //   });
    //   //remove the user from redis
    //   await client.srem("users", user);
    //   console.log("disconnect");
    // } catch (err) {
    //   console.log(err);
    // }
  };

  // socket.on("signup", signup);
  socket.on("connect to server", setConnectedUsers);
  socket.on("get connected users", getConnectedUsers);
  // socket.on("login", login);
  socket.on("disconnect", onDisconnect);
};
