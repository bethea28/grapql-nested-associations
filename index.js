const { ApolloServer, gql } = require('apollo-server')
const jwt = require('jsonwebtoken')

const JWT_SECRET = 'makethislongandrandom'

// This could also be MongoDB, PostgreSQL, etc
const db = {
  users: [
    {
      organization: '123', // this is a relation by id
      id: 'EL',
      name: 'Elon Musk',
    },
    {
      organization: '123', // this is a relation by id
      id: 'CH',
      name: 'CHRIS',
    },
  ],
  organizations: [
    {
      users: ['EL', 'CH'], // this is a relation by ids
      id: 'A',
      name: 'Space X',
    },
  ],
}

const server = new ApolloServer({
  context: (context) => {
    // console.log('REQUEST', context)
    // let user = null
    // try {
    //   const token = req.headers.authorization.replace('Bearer ', '')
    //   console.log('TOKEN', token)
    //   user = jwt.verify(token, JWT_SECRET)
    // } catch (error) {
    //   console.log('ERROR', error)
    // }
    // return { user }
  },
  typeDefs: gql`
    type Mutation {
      createUser(organization: String, id: String, name: String): User
    }
    type Query {
      login(username: String): String
      tellMeADadJoke: String
      users: [User]
      user(id: ID!): User
      organizations: [Organization]
      organization(id: ID!): Organization
    }
    type User {
      organization: Organization
      id: ID
      name: String
    }
    type Organization {
      users: [User]
      id: ID
      name: String
    }
  `,
  resolvers: {
    Mutation: {
      createUser(_, { organization, id, name }) {
        const user = { organization, id, name }
        const match = db.users.find((user) => user.name === name)
        if (match) throw Error('This username already exists')
        db.users.push(user)
        return user
      },
    },
    Query: {
      login(_, { username }) {
        const user = db.users.find((user) => user.name === username)
        if (!user) {
          throw Error('username was incorrect')
        }
        const token = jwt.sign({ id: user.id }, JWT_SECRET)
        return token
      },
      tellMeADadJoke(_, data, { user }) {
        if (!user) throw Error('not authorized')
        return 'If you see a robbery at an Apple Store does that make you an iWitness?'
      },
      users: () => {
        return db.users
      },
      user: (_, { id }) => db.users.find((user) => user.id === id),
      organizations: () => db.organizations,
      organization: (_, { id }) => {
        let done = db.organizations.find(
          (organization) => organization.id === id
        )
        console.log('done', done)
        return done
      },
    },
    // User: {
    //   organization: (parent) =>
    //     db.organizations.find(({ id }) => parent.organizationId === id),
    // },
    Organization: {
      users(parent) {
        console.log('ORGS bryan', parent)
        const organization = db.users.filter(({ id }) => {
          return parent.users.includes(id)
        })
        return organization
      },
    },
    // Organization: {
    //   async users(parent) {
    //     await new Promise((resolve) => setTimeout(resolve, 5000))
    //     console.log('ORGS bryan', parent)
    //     const organization = db.users.filter(({ id }) => {
    //       return parent.users.includes(id)
    //     })
    //     return organization
    //   },
    // },
  },
})

server.listen().then(({ url }) => console.log(`Server ready at ${url}`))
