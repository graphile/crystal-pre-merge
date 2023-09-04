import { loadOne } from "grafast";

async function batchGetUserById(ids) {
  const users = await db.users.find({ id: ids });
  return ids.map((id) => users.find((user) => user.id === id));
}


const plans = {
  Post: {
    author($post) {
      const $userId = $post.get("author_id");
      return loadOne($userId, batchGetUserById);
    },
  },
};
