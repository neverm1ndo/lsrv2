import { connect } from "mongoose";

import { env } from "@lsrv/common";

const {
	connection: { getClient: getMongoClient },
} = await connect(env.MONGO_URL);

export { getMongoClient };
