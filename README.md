# LET'S SHOOT THE DUCK

Web game arcade parody 2D: **trả lời câu hỏi → nhận đạn → bắn vịt → ghi điểm**.

- Frontend: HTML + CSS + JavaScript (ES modules), gameplay trên **Canvas 2D**, không bundler, không dependency.
- Backend: REST API stateless (Vercel serverless functions trong `api/`), chạy local bằng `dev-server.js` (Node thuần). File này cố tình không đặt tên `server.js`, vì Vercel sẽ tự nhận `server.js` làm Node server và bỏ qua cấu hình static + `api/`.
- Database: Redis qua `REDIS_URL` ở production; file JSON `data/scores.json` khi chạy local.

## Chạy local

Yêu cầu Node.js ≥ 22.9.

```bash
npm install      # không có dependency, bước này chỉ tạo lockfile
npm run dev      # http://localhost:3000, tự restart khi sửa code server
```

Production (self-host):

```bash
npm run build    # kiểm tra cú pháp toàn bộ JS
npm start
```

Biến môi trường: copy `.env.example` → `.env` (file `.env` đã được gitignore).

| Biến | Bắt buộc | Ý nghĩa |
|---|---|---|
| `SCORE_SECRET` | production | Chuỗi ≥16 ký tự để ký session token |
| `REDIS_URL` | production | Chuỗi kết nối Redis (`redis://` hoặc `rediss://`). Để trống khi chạy local |
| `PORT` | không | Mặc định 3000 |
| `TRUST_PROXY=1` | không | Tin `X-Forwarded-For` khi đứng sau reverse proxy |
| `MIN_GAME_SECONDS` | không | Thời gian chơi tối thiểu để nhận điểm (mặc định 25) |

## Deploy lên Vercel

1. Push repo lên GitHub → Import vào Vercel (Framework preset: **Other**). `vercel.json` đã cấu hình `public/` là static và `api/` là functions.
2. Vercel → Storage → tạo **Redis** và kết nối vào project (Vercel tự tạo biến `REDIS_URL`).
3. Settings → Environment Variables → thêm `SCORE_SECRET` (≥16 ký tự).
4. Redeploy.

Không có Redis trên Vercel thì điểm chỉ lưu tạm trong RAM và sẽ mất.

## API

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/session` | Gọi 1 lần khi bắt đầu game, trả về token ký HMAC |
| `POST` | `/api/scores` | Gửi điểm cuối game: `{ token, nickname, score, stats }` |
| `GET` | `/api/leaderboard?limit=10` | Top điểm (tối đa 20), CDN cache 5 giây |
| `GET` | `/api/leaderboard/:nickname` | Điểm cao nhất + hạng của 1 người chơi |

Mỗi game chỉ có 2–3 request. Gameplay (click, đạn, chuyển động) chạy hoàn toàn ở client.

### Luật chơi chính (`public/src/data/rules.js`)
- Stage 1 và 2 mỗi stage 1:30, Stage 3 là 3:00, tính cả lúc trả lời câu hỏi lẫn lúc bắn.
- Hết giờ Stage 3 hoặc hết máu: President Duck giơ cánh ăn mừng, đàn vịt khiêng banner "MAKE AMERICA GREAT AGAIN" bay xuống, kéo dài 10 giây trước màn kết quả. Lúc bắn không giới hạn thời gian riêng, wave kết thúc khi hết đạn.
- Mỗi câu hỏi 15 giây. Stage 1 và 2: 5 câu/wave. Stage 3: 8 câu/wave.
- Hướng dẫn dạng slide bấm xem tiếp (hình vẽ canvas ở trên, 1–2 dòng chữ ở dưới): HOW TO PLAY ở menu và trước tutorial (5 slide), briefing riêng trước mỗi stage (2–3 slide). Nội dung ở `public/src/data/slides.js`, hình vẽ ở `public/src/ui/slideArt.js`.
- Stage 2: câu sai = đạn cho cảnh sát. Stage 3: câu sai = đạn cho bodyguard. Hạ 3 bodyguard thì khiên President Duck tắt; sau 50 giây bắn thì khiên hồi và có bodyguard mới.

### Câu hỏi và đáp án mã hóa
- Sửa câu hỏi trong `data-src/questions.source.js` (đáp án dạng thường, **không** được serve cho người chơi).
- Chạy `npm run encode` (tự chạy trong `npm run build`) để sinh `public/src/data/questions.js`: mỗi câu chỉ có `answerCode`.
- Đáp án = `FNV-1a(question + code) % 4`, là index trong hash table 4 ô (`public/src/data/answerHash.js`), mất vài micro giây mỗi câu.
- Cách này chặn việc mở F12 đọc thẳng đáp án, nhưng hàm giải mã vẫn nằm ở client. Muốn chặn hoàn toàn thì phải để server giữ đáp án và chấm từng câu.

### Anti-cheat cơ bản (`lib/validate.js`)
- Token dùng 1 lần, có chữ ký HMAC, phải chơi đủ thời gian tối thiểu, hết hạn sau 2 giờ.
- Stats phải khớp luật: `correct + wrong = questions`, số câu không vượt quá thời gian chơi cho phép, `số phát bắn ≤ correct`, `số phát bắn ≥ số lần trúng`, số bodyguard khớp số lần khiên hồi…
- Điểm phải nằm trong `[điểm gốc, điểm gốc × 2]` (combo tối đa x2).
- Nickname được sanitize (A–Z, 0–9, space, `_`, `-`, 2–12 ký tự). UI luôn render bằng `textContent`.
- Rate limit theo IP và nickname.

## Bảng xếp hạng realtime (chạy local)

Trang riêng chỉ có bảng xếp hạng, hợp để chiếu lên màn hình lớn khi mọi người đang chơi.

```bash
npm run scoreboard      # http://localhost:4000
```

- Hiện cả **người đang chơi**: vào game là xuất hiện ngay với 0 điểm kèm nhãn `PLAYING · STAGE n`, sau mỗi stage cập nhật điểm. Điểm này **chưa qua kiểm tra** và chỉ hiện ở trang live; leaderboard chính thức trong game vẫn chỉ nhận điểm cuối game qua `/api/scores`.
- Đọc **cùng nguồn dữ liệu với game**: dùng Redis nếu có `REDIS_URL` trong `.env` (copy đúng chuỗi `REDIS_URL` từ Vercel là xem được điểm của bản đã deploy), không thì đọc `data/scores.json`.
- Server tự kiểm tra dữ liệu mỗi 2 giây và chỉ đẩy xuống trình duyệt khi có thay đổi, qua Server-Sent Events.
- Đổi hạng thì hàng tự trượt sang vị trí mới, nháy xanh khi lên hạng, nháy đỏ khi xuống hạng, kèm dấu `▲`/`▼` số hạng. Người mới lọt bảng thì trượt vào từ bên phải, điểm tăng thì chạy số.
- Biến tùy chọn: `SCOREBOARD_PORT` (4000), `SCOREBOARD_LIMIT` (15 người), `SCOREBOARD_POLL_MS` (2000).

### Load test
```bash
TRUST_PROXY=1 MIN_GAME_SECONDS=0 npm start
npm run loadtest -- http://localhost:3000 60 3
```
Kết quả trên máy local (file store): 60 người chơi đồng thời × 3 vòng = 720 request, 0 lỗi, p95 ≈ 66 ms.

## Cấu trúc

```
api/                    Serverless handlers (dùng chung cho Vercel và dev-server.js)
lib/                    store (Redis/file), token, rate limit, validation
public/
  index.html, css/
  src/
    game/               Game.js (điều phối), GameState.js (state machine), GameLoop.js (rAF)
    entities/           Duck, PoliceDuck, Bodyguard, PresidentDuck, Bullet, Player, duckArt
    systems/            Shooting, Question, Score, Joke, Audio (WebAudio), Effects
    stages/             Tutorial, Stage1 (School), Stage2 (Police), Stage3 (President), backgrounds
    ui/                 Menu, QuestionUI, TutorialUI, Leaderboard, ResultScreen, HUD
    api/                Client gọi API
    data/               questions.js, jokes.js, rules.js (luật dùng chung client + server)
scripts/                check.js (build), loadtest.js
```

## Điều khiển
- Chuột / chạm: bắn
- `1–4` hoặc `A–D`: chọn đáp án
- `ESC`: tạm dừng
- `M`: tắt/bật âm thanh

Tutorial chỉ chạy một lần (`localStorage.tutorialCompleted = true`). Muốn xem lại thì xóa key này.
