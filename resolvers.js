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

      // if (typeof data.email === "string") {
      //   const emailTaken = await prisma.user.findFirst({
      //     where: { email: data.email },
      //   });
      //   if (emailTaken) {
      //     throw new Error("Email already taken");
      //   }
      // }

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
          post: true,
          comment: true,
        },
      });

      // console.log(user);

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

    createPost: async (parent, { data }, { db, pubsub }, info) => {
      const userExists = await prisma.user.findUnique({
        where: { id: data.authorId },
      });
      if (!userExists) {
        throw new Error("user does not exist");
      }
      const post = {
        id: uuidv4(),
        ...data,
      };

      const createdPost = await prisma.post.create({
        data: post,
      });
      // if (data.published) {
      //   pubsub.publish("post", {
      //     post: {
      //       mutation: "CREATED",
      //       data: post,
      //     },
      //   });
      // }
      return createdPost;
    },

    updatePost: async (parent, { id, data }, { db, pubsub }, info) => {
      const post = await prisma.post.findUnique({
        where: { id },
      });
      const originalPost = { ...post };
      if (!post) {
        throw new Error("post does not exist!");
      }

      const updatedPost = await prisma.post.update({
        where: { id },
        data,
      });

      //   if (originalPost.published && !updatedPost.published) {
      //     pubsub.publish("post", {
      //       post: {
      //         mutation: "DELETED",
      //         data: originalPost,
      //       },
      //     });
      //   } else if (!originalPost.published && post.published) {
      //     pubsub.publish("post", {
      //       post: {
      //         mutation: "CREATED",
      //         data: post,
      //       },
      //     });
      //   } else if (originalPost.published && post.published) {
      //     pubsub.publish("post", {
      //       post: {
      //         mutation: "UPDATED",
      //         data: post,
      //       },
      //     });
      //   }
      // } else if (post.published) {
      //   pubsub.publish("post", {
      //     post: {
      //       mutation: "UPDATED",
      //       data: post,
      //     },
      //   });
      // }

      return updatedPost;
    },

    deletePost: async (parent, { id }, { db, pubsub }, info) => {
      const post = await prisma.post.findUnique({
        where: { id },
      });
      if (!post) {
        throw new Error("post does not exist!");
      }

      await prisma.post.delete({
        where: { id },
      });

      // if (post.published) {
      //   pubsub.publish("post", {
      //     post: {
      //       mutation: "DELETED",
      //       data: post,
      //     },
      //   });
      // }

      return post;
    },

    createComment: async (parent, { data }, { db, pubsub }, info) => {
      const { postId, text, authorId } = data;

      const userExists = await prisma.user.findFirst({
        where: {
          id: data.authorId,
        },
      });

      const postExists = await prisma.post.findFirst({
        where: {
          id: data.postId,
          published: true,
        },
      });
      if (!userExists || !postExists) {
        throw new Error("Unale to find user or post");
      }
      const comment = {
        id: uuidv4(),
        postId,
        text,
        authorId,
      };

      const commentCreated = await prisma.comment.create({
        data: comment,
      });

      // pubsub.publish(`comment ${data.post}`, {
      //   comment: {
      //     mutation: "CREATED",
      //     data: comment,
      //   },
      // });
      // pubsub.publish(`comment`, {
      //   comment: {
      //     mutation: "CREATED",
      //     data: comment,
      //   },
      // });
      return commentCreated;
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

    deleteComment: async (parent, { id }, { db, pubsub }, info) => {
      const comment = await prisma.comment.findUnique({
        where: {
          id,
        },
      });
      if (!comment) {
        throw new Error("comment does not exist!");
      }

      await prisma.comment.delete({
        where: {
          id,
        },
      });
      // pubsub.publish(`comment`, {
      //   comment: {
      //     mutation: "DELETED",
      //     data: comment,
      //   },
      // });
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
      return commentsData;
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
