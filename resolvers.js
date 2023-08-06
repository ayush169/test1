import { v4 as uuidv4 } from "uuid";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const resolvers = {
  Query: {
    me: async (parent, args, ctx, info) => {
      const user = await prisma.user.create({
        data: {
          name: "Aryan Dubey",
          email: "aryan@example.com",
          age: 39,
        },
      });
      return user;
    },
    post: async (parent, args, ctx, info) => {
      const myPost = await prisma.post.create({
        data: {
          title: `my post ${Math.floor(Math.random() * 1000)}`,
          body: `my post body ${Math.floor(Math.random() * 1000)}`,
          published: true,
          authorId: "6536b197-1222-4ea5-b4a8-1d6d087d3597",
        },
      });
      return myPost;
    },
    posts: async (p, { query }, ctx, i) => {
      if (!query) {
        // return db.postsData;
        return await prisma.post.findMany();
      }
      const postsData = await prisma.post.findMany({
        where: {
          authorId: query,
        },
      });
      return postsData;
    },
    users: async (p, args, ctx, i) => {
      return await prisma.user.findMany();
    },
    comments: async (p, args, ctx, i) => {
      return await prisma.comment.findMany();
    },
  },
  Mutation: {
    createUser: async (parent, { data }, { pubsub }, info) => {
      // const emailTaken = db.usersData.some((u) => u.email === data.email);
      const emailTaken = await prisma.user.findFirst({
        where: {
          email: data.email,
        },
      });
      if (emailTaken) {
        throw new Error("Email already taken");
      }
      const user = {
        id: uuidv4(),
        ...data,
      };

      // db.usersData.push(user);
      const newUser = await prisma.user.create({
        data: user,
      });
      // pubsub.publish("user", { user: newUser });

      return newUser;
    },

    updateUser: async (p, { id, data }, { db }, info) => {
      const user = await prisma.user.findUnique({
        where: {
          id,
        },
      });
      if (!user) {
        throw new Error("user does not exist!");
      }

      if (typeof data.email === "string") {
        const emailTaken = await prisma.user.findFirst({
          where: { email: data.email },
        });
        if (emailTaken) {
          throw new Error("Email already taken");
        }
      }

      const updatedUser = await prisma.user.update({
        where: {
          id,
        },
        data,
      });
      return updatedUser;
    },

    deleteUser: async (parent, { id }, ctx, info) => {
      const user = await prisma.user.findUnique({
        where: {
          id,
        },
        include: {
          posts: true,
          comments: true,
        },
      });

      console.log(user);

      if (!user) {
        // If user is not found, throw an error
        throw new Error("User does not exist");
      }

      // Delete the user
      const deletedUser = await prisma.user.delete({
        where: {
          id,
        },
      });

      return user;
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
      // pubsub.publish(`comment ${data.post}`, {
      //   comment: {
      //     mutation: "CREATED",
      //     data: comment,
      //   },
      // });
      pubsub.publish(`comment`, {
        comment: {
          mutation: "CREATED",
          data: comment,
        },
      });
      return comment;
    },

    updateComment: (parent, { id, data }, { db, pubsub }, info) => {
      const comment = db.commentsData.find((c) => c.id === id);
      if (!comment) {
        throw new Error("comment does not exist!");
      }

      if (typeof data.text === "string") {
        comment.text = data.text;
      }

      pubsub.publish(`comment`, {
        comment: {
          mutation: "UPDATED",
          data: comment,
        },
      });
      // pubsub.publish(`comment ${comment.postId}`, {
      //   comment: {
      //     mutation: "UPDATED",
      //     data: comment,
      //   },
      // });

      return comment;
    },

    deleteComment: (parent, { id }, { db, pubsub }, info) => {
      const comment = db.commentsData.find((c) => c.id === id);
      if (!comment) {
        throw new Error("comment does not exist!");
      }

      db.commentsData = db.commentsData.filter((comment) => comment.id !== id);
      pubsub.publish(`comment`, {
        comment: {
          mutation: "DELETED",
          data: comment,
        },
      });
      // pubsub.publish(`comment ${comment.postId}`, {
      //   comment: {
      //     mutation: "DELETED",
      //     data: comment,
      //   },
      // });
      return comment;
    },
  },

  Subscription: {
    comment: {
      subscribe: (parent, args, { db, pubsub }, info) => {
        return pubsub.asyncIterator(`comment`);
      },
    },
    user: {
      subscribe: (parent, args, { db, pubsub }, info) => {
        return pubsub.asyncIterator(`user`);
      },
    },
    // comment: {
    //   subscribe: (parent, { postId }, { db, pubsub }, info) => {
    //     const post = db.postsData.find((p) => p.id === postId && p.published);

    //     if (!post) {
    //       throw new Error("Post not found");
    //     }

    //     return pubsub.asyncIterator(`comment ${postId}`);
    //   },
    // },

    post: {
      subscribe: (parent, args, { pubsub }, info) => {
        return pubsub.asyncIterator("post");
      },
    },
  },

  Post: {
    author: async (parent, args, { db }, info) => {
      const user = await prisma.user.findUnique({
        where: {
          id: parent.authorId,
        },
      });
      return user;
    },
    comments: async (parent, args, { db }, info) => {
      // return db.commentsData.filter((c) => c.postId === parent.id);
      const commentsData = await prisma.comment.findMany({
        where: {
          postId: parent.id,
        },
      });
    },
  },
  User: {
    posts: async (parent, args, { db }, info) => {
      // return db.postsData.filter((p) => p.author === parent.id);
      const posts = await prisma.post.findMany({
        where: {
          authorId: parent.id,
        },
      });
      return posts;
    },
    comments: async (parent, args, { db }, info) => {
      const commentsData = await prisma.comment.findMany({
        where: {
          authorId: parent.id,
        },
      });
      return commentsData;
    },
  },
  Comment: {
    author: async (parent, args, { db }, info) => {
      const user = await prisma.user.findUnique({
        where: {
          id: parent.authorId,
        },
      });

      return user;
    },
    postId: async (parent, args, { db }, info) => {
      const post = await prisma.post.findUnique({
        where: {
          id: parent.postId,
        },
      });
      return post;
    },
  },
};

export default resolvers;
