const { buildSchema } = require("graphql");

module.exports = buildSchema(`
  type User {
    _id: ID!
    name: String!
    email: String!
    password: String!
    items: [Item!]!
    cart: [CartItem!]!
  }

  type AuthData {
    token: String!
    userId: String!
  }

  input UserInputData {
    email: String!
    name: String!
    password: String!
  }

  input ItemInputData {
    title: String!
    description: String!
    image: String
    price: Int!
  }

  type ItemData {
    items: [Item!]!
    totalItems: Int!
  }

  type Item {
    _id: ID!
    title: String!
    description: String!
    image: String
    price: Int!
    user: User!
    createdAt: String!
    updatedAt: String!
  }

  type CartItem {
    id: ID!
    quantity: Int!
    item: Item
    user: User!
  }

  type RootQuery {
    login(email: String!, password: String!): AuthData!
    user: User!
    items(page: Int): ItemData!
  }

  type RootMutation {
    createUser(userInput: UserInputData): User!
    createItem(itemInput: ItemInputData): Item!
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`);
