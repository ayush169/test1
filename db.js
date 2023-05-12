const usersData = [
  {
    id: "1",
    name: "Andrew",
    email: "andrew@example.com",
    age: 27,
  },
  {
    id: "2",
    name: "Sarah",
    email: "sarah@example.com",
  },
  {
    id: "3",
    name: "Mike",
    email: "mike@example.com",
  },
  {
    id: "4",
    name: "Jacok",
    email: "jacob@example.com",
  },
];

const postsData = [
  {
    id: "10",
    title: "GraphQL 101",
    body: "This is how to use GraphQL...",
    published: true,
    author: "1",
  },
  {
    id: "11",
    title: "GraphQL 201",
    body: "This is an advanced GraphQL post...",
    published: true,
    author: "4",
  },
  {
    id: "12",
    title: "Programming Music",
    body: "",
    published: false,
    author: "2",
  },
  {
    id: "13",
    title: "Next Js",
    body: "",
    published: false,
    author: "3",
  },
  {
    id: "14",
    title: "React",
    body: "",
    published: true,
    author: "1",
  },
  // {
  //   id: "15",
  //   title: "Python",
  //   body: "",
  //   published: false,
  //   author: "0",
  // },
];

const commentsData = [
  {
    id: "c1",
    text: "amazing",
    author: "3",
    postId: "11",
  },
  {
    id: "c2",
    text: "hala madrid",
    author: "4",
    postId: "10",
  },
  {
    id: "c3",
    text: "wow",
    author: "1",
    postId: "11",
  },
  {
    id: "c4",
    text: "outstandig",
    author: "3",
    postId: "14",
  },
  {
    id: "c5",
    text: "help me",
    author: "4",
    postId: "11",
  },
];

const db = { usersData, postsData, commentsData };

export default db;
