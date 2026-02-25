const handler = require("../api/auth");

function makeReq({ method = "GET", url = "/", headers = {}, body = null }) {
  const req = {
    method,
    url,
    headers,
  };

  const bodyBuf = body ? Buffer.from(body) : null;
  if (bodyBuf) {
    let sent = false;
    req[Symbol.asyncIterator] = async function* () {
      if (!sent) {
        sent = true;
        yield bodyBuf;
      }
    };
  } else {
    req[Symbol.asyncIterator] = async function* () {};
  }

  const res = {
    statusCode: 200,
    _headers: {},
    _chunks: [],
    setHeader(k, v) {
      this._headers[String(k).toLowerCase()] = v;
    },
    getHeader(k) {
      return this._headers[String(k).toLowerCase()];
    },
    end(chunk) {
      if (chunk) this._chunks.push(Buffer.from(chunk));
      this._ended = true;
    },
    write(chunk) {
      if (chunk) this._chunks.push(Buffer.from(chunk));
    },
  };

  return { req, res };
}

async function runTest() {
  process.env.ADMIN_USERNAME = "admin";
  process.env.ADMIN_PASSWORD = "pass";
  process.env.JWT_SECRET = "shhhh";

  // 1) POST /api/auth (action-based login)
  let { req, res } = makeReq({
    method: "POST",
    url: "/api/auth",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username: "admin", password: "pass" }),
  });
  await handler(req, res);
    console.log(
      "action-based /api/auth (login) ->",
    res.statusCode,
    Buffer.concat(res._chunks).toString(),
    res.getHeader("set-cookie")
  );

  // 2) POST /api/auth with action=login
  ({ req, res } = makeReq({
    method: "POST",
    url: "/api/auth",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "login",
      username: "admin",
      password: "pass",
    }),
  }));
  await handler(req, res);
    console.log(
      "action-based /api/auth (login) POST ->",
    res.statusCode,
    Buffer.concat(res._chunks).toString(),
    res.getHeader("set-cookie")
  );

  // 3) GET /api/auth?action=me (no cookie passed -> unauthenticated)
  ({ req, res } = makeReq({ method: "GET", url: "/api/auth?action=me" }));
  await handler(req, res);
    console.log(
      "action-based /api/auth?action=me ->",
    res.statusCode,
    Buffer.concat(res._chunks).toString()
  );

  // 4) POST logout via action
  ({ req, res } = makeReq({ method: "POST", url: "/api/auth", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "logout" }) }));
  await handler(req, res);
    console.log(
      "action-based /api/auth (logout) ->",
    res.statusCode,
    Buffer.concat(res._chunks).toString(),
    res.getHeader("set-cookie")
  );
}

runTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
