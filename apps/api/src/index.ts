import { createServer } from 'http';
import { createSchema, createYoga } from 'graphql-yoga';
import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers.js';
import * as dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

// Buat Skema GraphQL Executable
const schema = createSchema({
  typeDefs,
  resolvers,
});

// Inisialisasi GraphQL Yoga Server (GraphiQL GUI bawaan di browser)
const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  cors: {
    origin: '*',
    credentials: true,
  },
});

const server = createServer(yoga);

server.listen(PORT, () => {
  console.log(`🚀 GraphQL API Server siap di: http://localhost:${PORT}/graphql`);
  console.log(`📡 Gunakan URL di atas untuk mencoba Query & Mutation via GraphiQL.`);
});
