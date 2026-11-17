# Backend API handoff for the frontend

This doc is the contract between `dev-tinder-be` and `dev-tinder-fe`. Use it to build the UI for:
- swiping through people (right = interested, left = pass)
- accepting or rejecting requests
- blocking and unmatching
- chatting with connections

The product will be renamed later, so put the app name in one `APP_NAME` constant instead of hardcoding it.

## 1. Basics

- **Base URL:** `http://localhost:3000`. It's already in `src/utils/constant.js` as `BASE_URL`.
- **Auth:** a JWT is stored in an **httpOnly cookie** named `token` and expires after 1 day. The FE can't read it.
  - Every request must send `withCredentials: true`.
  - Create one axios instance in `src/utils/api.js`:
    ```js
    const api = axios.create({ baseURL: BASE_URL, withCredentials: true });
    api.interceptors.response.use(r => r, err => {
      if (err.response?.status === 401) { store.dispatch(removeUser()); window.location.assign("/login"); }
      return Promise.reject(err);
    });
    ```
  - Don't redirect on 401 for `/login` itself, because a wrong password also returns 401.
- **Errors:** every error response is `{ "error": "human readable message" }`, so show `err.response.data.error`.

| Status | Meaning |
|---|---|
| 400 | Bad input or an invalid ID |
| 401 | Not logged in or session expired. Also returned for a wrong login or a wrong current password. |
| 403 | Not allowed, e.g. messaging someone who isn't a connection |
| 404 | Not found. Also returned when a blocked user is involved; the API doesn't reveal blocks. |
| 409 | Duplicate: email already registered, or you already swiped on this user |
| 429 | Rate limited: 20 attempts per 15 minutes on login and signup; 10 messages per 10 seconds |
| 500 | Server error |

## 2. Data shapes

### User (as returned for other people)
```json
{
  "_id": "665f...",
  "firstName": "Ada", "lastName": "Lovelace",
  "photoUrl": "https://...",          // always set (falls back to a default avatar)
  "age": 28, "gender": "female",       // gender: "male" | "female" | "others"
  "about": "…", "skills": ["react", "node"],
  "headline": "Full-stack @ X", "location": "Bengaluru",
  "githubUrl": "https://github.com/ada",
  "experienceLevel": "senior"          // "student" | "junior" | "mid" | "senior" | "lead"
}
```
Any field except `_id`, `firstName` and `photoUrl` may be missing, and `lastName` can be missing too. Handle missing fields: for example, `user.lastName?.charAt(0)`.

The **logged-in user** (from `/login`, `/signup`, `/profile`) also has `emailId`, `createdAt` and `updatedAt`. The password is never sent.

Profile validation limits:
- firstName: 2–50 characters
- age: 18–100
- about: up to 500 characters
- skills: up to 10, each up to 30 characters
- headline and location: up to 100 characters
- photoUrl and githubUrl: must be http(s) URLs

The password must be at least 8 characters, with an uppercase letter, a lowercase letter, a number and a symbol.

### ConnectionRequest
```json
{ "_id": "…", "fromUserId": "<id or populated User>", "toUserId": "<id or populated User>",
  "status": "ignored|interested|accepted|rejected|blocked", "blockedBy": null, "createdAt": "…", "updatedAt": "…" }
```
| status | meaning |
|---|---|
| `ignored` | `fromUser` swiped left (passed) |
| `interested` | `fromUser` swiped right and is waiting for `toUser` to review |
| `accepted` | the two users are connected and can message |
| `rejected` | `toUser` rejected the request, or one side unmatched |
| `blocked` | `blockedBy` blocked the other user |

Any record between two users removes them from each other's feed.

## 3. REST endpoints

### Auth
| Method & path | Body | Success response |
|---|---|---|
| `POST /signup` | `{ firstName, lastName, emailId, password, ...optional profile fields }` | `201` with the logged-in User. **The cookie is set**, so the user is already logged in. Send them to profile setup. |
| `POST /login` | `{ emailId, password }` | `200` with the logged-in User. Errors: 400 for a missing field, 401 for invalid credentials. |
| `POST /logout` | none | `{ message }` |

### Profile (me)
| Method & path | Body | Success response |
|---|---|---|
| `GET /profile` | none | the logged-in User. Call this on app load to restore the session; a 401 means go to `/login`. |
| `PATCH /profile` | any subset of: `firstName lastName age gender about skills photoUrl headline location githubUrl experienceLevel` | `{ message, data: User }`. Any other key returns 400. |
| `PATCH /profile/password` | `{ currentPassword, newPassword }` | `{ message }`. 401 means the current password is wrong. |

### Discovery
| Method & path | Success response |
|---|---|
| `GET /user/feed?page=1&limit=10&skills=react,node` | `User[]`. Lists people you haven't interacted with yet. `limit` max is 50. `skills` filters on any of the skills, case-insensitive. An empty array means nobody is left. |
| `GET /user/:userId` | `User` plus `connection`. `connection` is `null` when there's no relationship, otherwise `{ requestId, status, sentByMe }`. Use it to decide which buttons to show. Returns 404 if the other user blocked you. Your own ID returns you with `connection: null`. |

**Feed pagination:** swiped users drop out of the results, so the next page shifts. Keep it simple: always fetch `page=1` when the card stack runs low, after your swipes have been sent. Don't increment `page`.

### Swipe / requests
| Action | Method & path | Success response |
|---|---|---|
| Swipe right | `POST /request/send/interested/:toUserId` | `201 { message, matched: false, data }`. If the other user had already swiped right on you, you get **`200 { message: "It's a match!", matched: true, data }`**. Show the "It's a match" modal with a link to chat. |
| Swipe left | `POST /request/send/ignored/:toUserId` | `201 { message, matched: false, data }` |
| Withdraw my pending request | `DELETE /request/send/:toUserId` | `{ message }` |
| Accept or reject a request I received | `POST /request/review/accepted/:requestId` or `.../rejected/:requestId` | `{ message, data }`. **Uses the request's `_id`, not the user's ID.** |
| Unmatch a connection | `DELETE /request/connection/:userId` | `{ message }`. Also closes the chat (see the `chatClosed` socket event). |
| Block | `POST /request/block/:userId` | `{ message }`. Works whatever the relationship, including an existing connection, and closes the chat. |
| Unblock | `DELETE /request/block/:userId` | `{ message }`. The two users can show up in each other's feeds again. |

Swiping on someone you already interacted with returns 409. In the UI, remove the card anyway.

### Lists
| Method & path | Success response |
|---|---|
| `GET /user/requests/received` | `ConnectionRequest[]` with **`fromUserId` populated** as a User. Use `req._id` for review. |
| `GET /user/requests/sent` | `ConnectionRequest[]` with **`toUserId` populated** as a User |
| `GET /user/connections` | `User[]` |
| `GET /user/blocked` | `User[]` (people *I* blocked) |

### Chat (connections only)
| Method & path | Success response |
|---|---|
| `GET /chats` | Inbox: `[{ chatId, user: User, lastMessage: { text, senderId, createdAt }, lastMessageAt, unreadCount }]`, newest first. Only includes chats that have at least one message and whose users are still connected. |
| `GET /chat/:targetUserId?before=<ISO date>&limit=30` | `{ chatId \| null, user: User, messages: Message[] (oldest → newest), hasMore }`. To load older messages, pass `before` = the `createdAt` of the oldest loaded message. Returns 403 if the users aren't connected. |
| `POST /chat/:targetUserId` with body `{ text }` | `201 Message`. REST fallback; prefer the socket. |
| `POST /chat/:targetUserId/read` | `{ chatId, readAt, count }`. Marks the other person's messages as read. |

`Message` = `{ _id, chatId, senderId, text, readAt: null | date, createdAt, updatedAt }`. Text is at most 2000 characters. **Render it as plain text** (React escaping is enough; never use `dangerouslySetInnerHTML`).

## 4. Real-time chat with socket.io

Install it with `npm i socket.io-client`. Connect **only after login** and disconnect on logout.

In production, REST requests go through the Vercel `/api` proxy, but the socket connects to the backend directly, so the cookie isn't sent with it. Before every connection attempt, the frontend fetches a 60-second token from `GET /socket-token` (through the proxy) and sends it in the handshake. In local development the cookie also works.
```js
import { io } from "socket.io-client";
const socket = io(SOCKET_URL, {
  withCredentials: true,
  auth: async (cb) => {
    try { const { data } = await api.get("/socket-token"); cb({ token: data.token }); }
    catch { cb({}); }
  },
});
socket.on("connect_error", (e) => { /* e.message === "Unauthorized" → not logged in */ });
```
`GET /socket-token` returns `{ token }`. The token only works for opening a socket.
Keep one socket for the whole app, for example in a context or a module singleton.

**Client → server** (each one takes an optional ack callback, which receives `{ ok: true, ... }` or `{ ok: false, status, error }`):
| Event | Payload | Ack on success |
|---|---|---|
| `joinChat` | `{ targetUserId }` | `{ ok, roomId }`. Call it when the chat page opens. Fails with 403 if the users aren't connected. |
| `leaveChat` | `{ targetUserId }` | `{ ok }`. Call it when the page closes. |
| `sendMessage` | `{ targetUserId, text }` | `{ ok, message }`. Fails with 400 (empty or too long), 403 (not connected) or 429 (rate limited). |
| `typing` | `{ targetUserId, isTyping }` | no ack. Only works after `joinChat`. |
| `markRead` | `{ targetUserId }` | `{ ok, chatId, readAt, count }` |

**Server → client:**
| Event | Payload | When |
|---|---|---|
| `messageReceived` | `Message` | A new message in a chat you joined. **The sender gets it too**: either de-duplicate it by `_id` against the ack, or rely on this event and skip the optimistic insert. |
| `inboxUpdated` | `{ fromUserId, message }` | Someone sent you a message, even if that chat isn't open. Update `/chats` and the unread badge. |
| `typing` | `{ userId, isTyping }` | The other person is typing |
| `messagesRead` | `{ chatId, readerId, readAt }` | The other person read your messages. Show "Seen". |
| `chatClosed` | `{ reason: "blocked" \| "unmatched", userIds: [a, b] }` | A block or unmatch happened. Close or disable the chat, and remove the user from connections and the inbox. |

## 5. Existing FE bugs to fix first
- `utils/feedSlice.js`: `removeFeed` returns `null`, which crashes `feedData.length` in `Feed.jsx`. Return `[]` instead, and add `removeUserFromFeed(id)`.
- `components/UserCard.jsx`: it checks `user.profileImage` but renders `user.profilePicture`. The field is now **`photoUrl`** and is always set. `Navbar.jsx` uses `profileImage` too.
- `components/Login.jsx`: remove the hardcoded email and password. The error is already read correctly from `error.response.data.error`, but guard against `error.response` being undefined (network error).
- `user.lastName.charAt(0)` in Navbar and UserCard crashes when `lastName` is missing.
- `Body.jsx`: render a loader until `/profile` resolves. Also make `/` redirect to `/feed` (when logged in) or `/login`.
- `Footer.jsx` is `fixed bottom-0`, so it covers content. Add bottom padding to the main content.

## 6. Screens to build
1. **`/signup`**: firstName, lastName, email, password (show the password rules). On success, `addUser` and go to `/profile`. Link it from Login.
2. **`/feed`**: show one card at a time, as a stack.
   - Actions: Pass (left) and Interested (right) buttons, drag-to-swipe (`framer-motion` or `react-tinder-card`), and the ← → arrow keys.
   - On each action, remove the card optimistically, then call the API.
   - When fewer than 3 cards are left, refetch `page=1`.
   - Show the match modal when `matched: true`.
   - Card menu: View profile and Block.
   - Empty state: "You've seen everyone, check back later".
   - Optional skills filter.
3. **`/profile`**: edit form for every editable field, with a live `UserCard` preview. Use a tag input for skills (max 10). Calls `PATCH /profile`.
4. **`/requests`**: two tabs.
   - Received: Accept or Reject each one.
   - Sent: Withdraw.
   - Put a count badge in the Navbar.
5. **`/connections`**: list with Message, View profile, Unmatch (confirm first) and Block (confirm first).
6. **`/user/:id`**: read-only profile. Choose the buttons from `connection`:
   - `null`: Interested and Pass
   - `interested` with `sentByMe`: "Request sent" and Withdraw
   - `interested` without `sentByMe`: Accept and Reject, using `requestId`
   - `accepted`: Message and Unmatch
   - `blocked`: Unblock
   - Block is always available.
7. **`/chats`**: inbox with unread badges, kept live with `inboxUpdated`.
8. **`/chat/:userId`**:
   - Load history on open and on scroll-up (`before`).
   - Call `joinChat` and `markRead` on open, and again when a new message arrives while the tab is focused.
   - Show the typing indicator and "Seen".
   - On `chatClosed`, disable the input and show "This conversation is no longer available".
9. **`/settings`**: change password, blocked users list with Unblock, and logout. The Navbar already has a "Settings" link that goes nowhere; point it here.
- **Navbar:** links to Feed, Requests (with badge), Connections and Chats (with unread badge). Replace the "daisyUI" text with `APP_NAME`.
- **Redux:** add `connectionsSlice`, `requestsSlice` and `chatSlice` (inbox plus unread counts). Clear every slice on logout.
- **Toasts:** show success and error toasts with daisyUI `toast`.

---

## 7. v2 API additions (photos, prompts, projects, undo, demo accounts)

### New fields on User (returned everywhere a User is returned)
```jsonc
{
  "photos": [{ "url": "https://res.cloudinary.com/...", "publicId": "kodo/users/<id>/abc" }], // max 6, order = display order
  "photoUrl": "…",            // always equals photos[0].url (or the default avatar). Use photos for carousels.
  "prompts": [{ "question": "My most controversial tech opinion", "answer": "…" }], // max 3, questions from GET /meta
  "projects": [{ "_id": "…", "title": "Will you be my Valentine?", "description": "…", "url": "https://…",
                 "repoUrl": "https://github.com/…", "imageUrl": "https://…", "tags": ["react"] }], // max 5
  "isDemo": true,              // seeded demo profile: show a small "Demo" badge on cards
  "onboardingCompleted": false // only on the logged-in user (/profile, /login, /signup)
}
```
- `lastName` is now **optional** at signup. Only `firstName`, `emailId` and `password` are required.
- `about` no longer has a default value, so it may be missing.

### Meta (public, no login)
| Method & path | Success response |
|---|---|
| `GET /meta` | `{ genders, experienceLevels, promptQuestions: string[], limits: { photos, prompts, promptAnswer, projects, projectTitle, projectDescription, projectTags, skills, skill, about, shortText, photoMaxBytes, messageMax }, photoUploadsEnabled }`. Use it for the onboarding and profile forms instead of hardcoding these values. |
| `GET /meta/showcase` | Up to 6 random **demo** profiles `{ _id, firstName, age, headline, location, photoUrl, skills (≤3), prompt: { question, answer } }`, for the landing page preview. Real users are never included. |

### Profile content
`PATCH /profile` now also accepts **`prompts`**, **`projects`** and **`onboardingCompleted`**. Arrays are **replaced as a whole**, so send the full list every time.
- Each prompt `question` must be one of `promptQuestions`, and each question can be used only once.
- Every URL field must start with `http(s)://`.
- Validation errors return 400 with a readable `error`.

Set `onboardingCompleted: true` when the user finishes onboarding. Use it to send users who haven't finished back into onboarding after login.

### Photo upload (direct to Cloudinary; the file never goes through our server)
If `GET /meta` returns `photoUploadsEnabled: false`, hide the upload UI. These endpoints then return 503.
```js
// 1. get signed params (one per file)
const { data: { uploadUrl, params } } = await api.post("/profile/photos/upload-signature");
// 2. upload the file straight to Cloudinary (plain fetch, NOT the api instance: no cookies, no /api proxy)
const form = new FormData();
Object.entries(params).forEach(([k, v]) => form.append(k, v));
form.append("file", file);                                   // jpg/png/webp/heic, ≤10 MB
const uploaded = await (await fetch(uploadUrl, { method: "POST", body: form })).json();
if (uploaded.error) throw new Error(uploaded.error.message);
// 3. attach it to the profile
const { data } = await api.post("/profile/photos", { publicId: uploaded.public_id }); // -> { photos, photoUrl }
```
| Method & path | Body / query | Success response |
|---|---|---|
| `POST /profile/photos/upload-signature` | none | `{ uploadUrl, params }`. Returns 400 if the profile already has 6 photos. |
| `POST /profile/photos` | `{ publicId }` | `201 { photos, photoUrl }`. 400 for a bad ID or a file over 10 MB; 409 if the photo was already added. |
| `DELETE /profile/photos?publicId=…` (or `?index=N` for photos without a `publicId`) | none | `{ photos, photoUrl }` |
| `PATCH /profile/photos/order` | `{ order: [2,0,1] }`, the new order of the current indexes | `{ photos, photoUrl }`. The first photo becomes the main photo. |

Upload progress: use `XMLHttpRequest` (or axios **without** `withCredentials`) to Cloudinary if you want a progress bar. Compress or resize large images on the client first, which is optional.

### Undo
| Method & path | Success response |
|---|---|
| `POST /request/undo` | Undoes **my most recent swipe**, either a pass or a like that hasn't been answered yet. Returns `{ message, undoneStatus: "ignored" \| "interested", user: User }`, so put `user` back on top of the card stack. Returns 404 "Nothing to undo" otherwise. A match can't be undone; use unmatch for that. |
| `GET /user/passed` | `User[]`: people I swiped left on, newest first (max 100) |
| `DELETE /request/swipe/:userId` | Undoes my pass or pending like on that user, who then returns to my feed. `{ message }`, or 404. |

### Demo accounts
- `npm run seed` in the backend creates 16 demo developer profiles with illustrated avatars, prompts and projects. Real users always appear in the feed **before** demo profiles.
- Swiping right on a demo profile is an **instant match** (`matched: true`).
- When someone signs up, 3 random demo users swipe right on them, so the Requests tab has content straight away.
- Messaging a demo user: about 1 second later they mark your messages as read (`messagesRead`), then show `typing`, and about 3 seconds after your message they reply (`messageReceived`). Your existing chat UI handles all of this already.
