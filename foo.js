import { DataLoader } from "dataloader";

async function batchGetUserById(ids) {
  const users = await db.users.find({ id: ids });
  return ids.map((id) => users.find((user) => user.id === id));
}

function makeGraphQLContext(req) {
  return {
    userLoader: new DataLoader(batchGetUserById),
    postLoader: new DataLoader(batchGetPostById),
    postsByForumIdLoader: new DataLoader(batchGetPostsByForumId),
    // ... x 300
  };
}

const resolvers = {
  Post: {
    author(post, _, context) {
      const userId = post.author_id;
      return context.userLoader.load(userId);
    },
  },
};
