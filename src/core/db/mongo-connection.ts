import type { MongoClient } from "mongodb";
import { connect } from "mongoose";

import { env } from "@lsrv/common/environment";

const clientPromise: Promise<MongoClient> = connect(env.MONGO_URL).then(({ connection }) => connection.getClient());

export { clientPromise };
