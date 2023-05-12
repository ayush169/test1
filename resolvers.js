import { v4 as uuidv4 } from "uuid";

const resolvers = {
  Query: {
    me: (parent, args, { db }, info) => {
      return {
        id: "0",
        name: "ayush",
        email: "ayush@a.com",
        posts: db.postsData.filter((p) => p.author == "0"),
      };
    },
    post: (parent, args, { db }, info) => {
      return {
        id: "13",
        title: "Programming Games",
        body: "",
        published: false,
        author: db.usersData[1],
      };
    },
    posts: (p, { query }, { db }, i) => {
      if (!query) {
        return db.postsData;
      }
      return db.postsData.filter((post) => post.id !== query);
    },
    users: (p, { query }, { db }, i) => {
      if (!query) {
        return db.usersData;
      }
      return db.usersData.filter((u) =>
        u.name.toLowerCase().includes(query.toLowerCase())
      );
    },
    comments: (p, args, { db }, i) => db.commentsData,
  },
  Mutation: {
    createUser: (parent, { data }, { db }, info) => {
      const emailTaken = db.usersData.some((u) => u.email === data.email);
      if (emailTaken) {
        throw new Error("Email already taken");
      }
      const user = {
        id: uuidv4(),
        ...data,
      };

      db.usersData.push(user);
      return user;
    },

    updateUser: (p, { id, data }, { db }, info) => {
      const user = db.usersData.find((u) => u.id === id);
      if (!user) {
        throw new Error("user does not exist!");
      }

      if (typeof data.email === "string") {
        const emailTaken = db.usersData.some((u) => u.email === user.email);
        if (emailTaken) {
          throw new Error("Email already taken");
        }

        user.email = data.email;
      }

      if (typeof data.name === "string") {
        user.name = data.name;
      }

      if (typeof data.age !== "undefined") {
        user.age = data.age;
      }

      return user;
    },

    deleteUser: (parent, { id }, { db }, info) => {
      const userIndex = db.usersData.findIndex((u) => u.id === id);

      if (userIndex === -1) {
        throw new Error("user does not exist");
      }

      const deletedUsers = db.usersData.splice(userIndex, 1);

      db.postsData = db.postsData.filter((post) => {
        const match = post.author === id;

        if (match) {
          db.commentsData = db.commentsData.filter(
            (comment) => comment.postId !== post.id
          );
        }
        return !match;
      });

      db.commentsData = db.commentsData.filter(
        (comment) => comment.author !== id
      );

      return deletedUsers[0];
    },

    createPost: (parent, { data }, { db, pubsub }, info) => {
      const userExists = db.usersData.some((u) => u.id === data.author);
      if (!userExists) {
        throw new Error("user does not exist");
      }
      const post = {
        id: uuidv4(),
        ...data,
      };
      db.postsData.push(post);
      if (data.published) {
        pubsub.publish("post", {
          post: {
            mutation: "CREATED",
            data: post,
          },
        });
      }
      return post;
    },

    updatePost: (parent, { id, data }, { db, pubsub }, info) => {
      const post = db.postsData.find((p) => p.id === id);
      const originalPost = { ...post };
      if (!post) {
        throw new Error("post does not exist!");
      }

      if (typeof data.title === "string") {
        post.title = data.title;
      }
      if (typeof data.body === "string") {
        post.body = data.body;
      }
      if (typeof data.published === "boolean") {
        post.published = data.published;

        if (originalPost.published && !post.published) {
          pubsub.publish("post", {
            post: {
              mutation: "DELETED",
              data: originalPost,
            },
          });
        } else if (!originalPost.published && post.published) {
          pubsub.publish("post", {
            post: {
              mutation: "CREATED",
              data: post,
            },
          });
        } else if (originalPost.published && post.published) {
          pubsub.publish("post", {
            post: {
              mutation: "UPDATED",
              data: post,
            },
          });
        }
      } else if (post.published) {
        pubsub.publish("post", {
          post: {
            mutation: "UPDATED",
            data: post,
          },
        });
      }

      return post;
    },

    deletePost: (parent, { id }, { db, pubsub }, info) => {
      const post = db.postsData.find((p) => p.id === id);
      if (!post) {
        throw new Error("post does not exist!");
      }

      db.postsData = db.postsData.filter((post) => post.id !== id);

      db.commentsData = db.commentsData.filter(
        (comment) => comment.postId !== id
      );

      if (post.published) {
        pubsub.publish("post", {
          post: {
            mutation: "DELETED",
            data: post,
          },
        });
      }

      return post;
    },

    createComment: (parent, { data }, { db, pubsub }, info) => {
      const userExists = db.usersData.some((u) => u.id === data.author);
      const postExists = db.postsData.some(
        (p) => p.id === data.post && p.published
      );
      if (!userExists || !postExists) {
        throw new Error("Unale to find user or post");
      }
      const comment = {
        id: uuidv4(),
        postId: data.post,
        ...data,
      };
      db.commentsData.push(comment);
      pubsub.publish(`comment ${data.post}`, { comment });
      return comment;
    },

    updateComment: (parent, { id, data }, { db }, info) => {
      const comment = db.commentsData.find((c) => c.id === id);
      if (!comment) {
        throw new Error("comment does not exist!");
      }

      if (typeof data.text === "string") {
        comment.text = data.text;
      }

      return comment;
    },

    deleteComment: (parent, { id }, { db }, info) => {
      const comment = db.commentsData.find((c) => c.id === id);
      if (!comment) {
        throw new Error("comment does not exist!");
      }

      db.commentsData = db.commentsData.filter((comment) => comment.id !== id);

      return comment;
    },
  },

  Subscription: {
    comment: {
      subscribe: (parent, { postId }, { db, pubsub }, info) => {
        const post = db.postsData.find((p) => p.id === postId && p.published);

        if (!post) {
          throw new Error("Post not found");
        }

        return pubsub.asyncIterator(`comment ${postId}`);
      },
    },

    post: {
      subscribe: (parent, args, { pubsub }, info) => {
        return pubsub.asyncIterator("post");
      },
    },
  },

  Post: {
    author: (parent, args, { db }, info) => {
      return db.usersData.find((u) => u.id === parent.author);
    },
    comments: (parent, args, { db }, info) => {
      return db.commentsData.filter((c) => c.postId === parent.id);
    },
  },
  User: {
    posts: (parent, args, { db }, info) => {
      return db.postsData.filter((p) => p.author === parent.id);
    },
    comments: (parent, args, { db }, info) => {
      return db.commentsData.filter((c) => c.author === parent.id);
    },
  },
  Comment: {
    author: (parent, args, { db }, info) => {
      return db.usersData.find((u) => u.id === parent.author);
    },
    postId: (parent, args, { db }, info) => {
      return db.postsData.find((p) => p.id === parent.postId);
    },
  },
};

export default resolvers;
