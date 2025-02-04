const typeDefs = `#graphql
  type Query {
    me: User!
    post: Post!
    users: [User!]!
    posts(query: String): [Post]!
    comments: [Comment]!
  }

  type Mutation {
    createUser(data: CreateUserInput!): User!
    updateUser(id: ID!, data: UpdateUserInput!): User!
    deleteUser(id: ID!): User!
    createPost(data: CreatePostInput!): Post!
    updatePost(id: ID!, data: UpdatePostInput!): Post!
    deletePost(id: ID!): Post!
    createComment(data: CreateCommentInput!): Comment!
    updateComment(id: ID!, data: UpdateCommentInput!): Comment!
    deleteComment(id: ID!): Comment!
  }

  type Subscription {
    comment: CommentSubscriptionPayload!
    post: PostSubscriptionPayload!
    user: User!
  }

  input CreateUserInput {
    name: String!
    email: String!
    age: Int
  }

  input UpdateUserInput {
    name: String
    email: String
    age: Int
  }

  input CreatePostInput {
    title: String!
    body: String!
    published: Boolean!
    authorId: ID!
  }

  input UpdatePostInput {
    title: String
    body: String
    published: Boolean
  }

  input CreateCommentInput {
    text: String!
    authorId: ID!
    postId: ID!
  }

  input UpdateCommentInput {
    text: String!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    age: Int
    posts: [Post]!
    comments: [Comment]!
  }

  type Post {
    id: ID!
    title: String!
    body: String!
    published: Boolean!
    author: User!
    comments: [Comment]!
  }

  type Comment {
    id: ID
    text: String
    author: User!
    postId: Post!
  }

  enum MutationType {
    CREATED
    UPDATED
    DELETED
  }

  type PostSubscriptionPayload {
    mutation: MutationType!
    data: Post!
  }

  type CommentSubscriptionPayload {
    mutation: MutationType!
    data: Comment!
  }
`;

export default typeDefs;
