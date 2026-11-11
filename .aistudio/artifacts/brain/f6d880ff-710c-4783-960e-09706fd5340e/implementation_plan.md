# Tích Hợp Đồng Hồ Định Vị Thông Minh Cho Bé (KidHero Watch)

Bổ sung tính năng kết nối và đồng bộ hóa thời gian thực giữa ứng dụng **KidHero** và đồng hồ định vị của bé thông qua mã QR gia đình, cung cấp giao diện mặt đồng hồ thu nhỏ trực quan để bé theo dõi và bấm hoàn thành nhiệm vụ ngay trên cổ tay.

## User Review & Critical Decisions

> [!IMPORTANT]
> Kế hoạch dưới đây đã được thiết kế dựa trên các lựa chọn của bạn trong bước khảo sát vừa rồi:

- **Tính năng cốt lõi đã xác nhận**: Giao diện đồng hồ thông minh thu nhỏ (Smartwatch Companion UI) kết hợp đồng bộ hóa danh sách nhiệm vụ hằng ngày theo thời gian thực.
- **Phương thức kết nối đã xác nhận**: Tạo và quét mã QR liên kết trực tiếp với Mã Gia Đình (`Family Code`) để ghép đôi đồng hồ nhanh chóng mà không cần nhập ký tự thủ công trên màn hình nhỏ.
- **Tương tác tích sao đã xác nhận**: Cho phép bé chạm để đánh dấu hoàn thành nhiệm vụ ngay trên màn hình đồng hồ, tự động cộng Sao (⭐), điểm Kinh nghiệm (⚡ XP), phát âm thanh khích lệ và cập nhật tức thì về máy của bố mẹ.
- **Hỗ trợ đường dẫn truy cập nhanh trên trình duyệt đồng hồ**: Hỗ trợ chế độ toàn màn hình thu gọn (kích hoạt tự động khi quét mã QR có tham số `?watch=1&family=...` hoặc mở từ thanh công cụ) để hiển thị vừa vặn trên màn hình vuông/tròn của đồng hồ định vị có trình duyệt web.

---

## 1. Overview & Core Concept

- **What It Does**: Cung cấp trung tâm kết nối **KidHero Watch** gồm hai phần:
  1. **Trình ghép đôi QR & Quản lý đồng hồ** (trong mục Đồng bộ và Bảng điều khiển Phụ huynh): Hiển thị mã QR định danh gia đình, trạng thái kết nối đồng hồ, mức pin đồng hồ và nhật ký hoàn thành từ đồng hồ.
  2. **Giao diện Mặt Đồng Hồ Thông Minh (Smartwatch Mode)**: Mô phỏng chân thực mặt đồng hồ định vị của trẻ với khung viền bo tròn, nút vặn Digital Crown, mặt đồng hồ kim/số hiển thị giờ hiện tại, số Sao tích lũy, linh vật Rồng Con thu nhỏ, lời nhắn từ ba mẹ và danh sách nhiệm vụ vuốt dọc với nút bấm hoàn thành cỡ lớn ($\ge 44\text{px}$).
- **Target Audience / Persona**:
  - **Các bé tiểu học**: Xem giờ, nghe giọng đọc nhắc việc, và bấm hoàn thành nhiệm vụ nhanh ngay trên đồng hồ định vị mọi lúc mọi nơi.
  - **Phụ huynh**: Quét mã QR để cài đặt nhanh cho đồng hồ của con và nhận thông báo đồng bộ thời gian thực khi con hoàn thành việc ở nhà hoặc ở trường.
- **Key Value**: Giúp bé duy trì thói quen tự lập liền mạch ngay cả khi không cầm điện thoại hay máy tính bảng, đồng thời tăng hứng thú nhờ trải nghiệm thiết bị đeo thông minh hiện đại.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Luồng ghép đôi qua mã QR (QR Watch Pairing)**:
     - Phụ huynh hoặc bé bấm nút **"Đồng hồ"** trên thanh công cụ hoặc trong cửa sổ **Đồng bộ**.
     - Hệ thống tự động sinh mã QR sắc nét (SVG chuẩn hóa) chứa đường dẫn kết nối nhanh kèm `Family Code` hiện tại.
     - Khi quét mã QR từ đồng hồ (hoặc bấm nút *"Mô phỏng quét QR trên đồng hồ"*), thiết bị ngay lập tức đồng bộ hồ sơ của bé và chuyển sang giao diện mặt đồng hồ thông minh.
  2. **Luồng sử dụng & hoàn thành nhiệm vụ trên mặt đồng hồ (On-Watch Quest Completion)**:
     - Mặt đồng hồ có 3 màn hình vuốt/chuyển nhanh dễ thao tác bằng 1 ngón tay:
       - **Mặt chính (Watch Face)**: Đồng hồ số lớn, ngày tháng, pin, tín hiệu định vị khu vực an toàn (Nhà / Trường học), tổng số Sao ⭐, linh vật Rồng Con và thanh tiến độ nhiệm vụ trong ngày.
       - **Màn hình Nhiệm vụ (Watch Quests)**: Danh sách các nhiệm vụ trong ngày được tối ưu dạng thẻ gọn gàng. Bé chạm vào nút tròn lớn để đánh dấu hoàn thành $\rightarrow$ Hiệu ứng pháo giấy mini + cộng Sao/XP + giọng nói khen ngợi phát ngay lập tức.
       - **Màn hình Lời nhắn & Thú cưng (Parent Message & Pet)**: Hiển thị lời nhắn mục tiêu trong ngày của ba mẹ (kèm nút nghe đọc giọng nói) và nút cho Rồng Con ăn táo ngay trên đồng hồ.
  3. **Luồng đồng bộ thời gian thực về Bảng điều khiển Phụ huynh**:
     - Ngay khi bé bấm hoàn thành nhiệm vụ trên màn hình đồng hồ, dữ liệu được đẩy lên máy chủ đồng bộ (`/api/sync/:familyCode`) và kênh liên kết đa tab (`BroadcastChannel`), cập nhật ngay số Sao, biểu đồ tiến độ và độ vui vẻ của Rồng Con trên màn hình của bố mẹ.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Thiết kế giao diện thiết bị đeo thông minh (Kid-Friendly Wearable OS) với khung vỏ đồng hồ thể thao bo cong mềm mại (`rounded-[44px]`), viền kim loại mờ, nút bấm vật lý mô phỏng bên cạnh phải và màn hình OLED độ tương phản cao giúp bé dễ nhìn ngoài trời.
  - *Color Palette & Mood*:
    - Nền màn hình đồng hồ sử dụng tông tối sâu (`slate-950` / `indigo-950`) chuẩn màn hình AMOLED tiết kiệm pin của đồng hồ định vị, kết hợp sắc vàng hổ phách (`amber-400`) cho ngôi sao, xanh ngọc lục bảo (`emerald-400`) cho nhiệm vụ hoàn thành, và tím sáng (`indigo-400`) cho thanh kinh nghiệm XP.
  - *Typography & Hierarchy*:
    - Giữ nguyên bộ font `Outfit` / `Plus Jakarta Sans` cho tiêu đề dễ đọc và `JetBrains Mono` (`tabular-nums`) cho đồng hồ số, phần trăm pin và bộ đếm ngôi sao.
  - *Component Styling & Layout*:
    - Mọi nút tương tác trên mặt đồng hồ đảm bảo kích thước chạm tối thiểu $44 \times 44\text{px}$ theo tiêu chuẩn thiết bị cảm ứng nhỏ, chỉ hiển thị 1–2 thông tin trọng tâm trên mỗi thẻ để không gây rối mắt.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Tích hợp chế độ kép (Khung mô phỏng Smartwatch trực tiếp & Chế độ toàn màn hình cho trình duyệt đồng hồ)**
  - *Chosen Approach*: Cho phép mở mặt đồng hồ ngay trong ứng dụng dưới dạng thiết bị đeo tương tác trực quan, đồng thời hỗ trợ tham số URL `?watch=1` để khi quét mã QR bằng trình duyệt trên đồng hồ thật, giao diện tự động mở toàn màn hình vừa khít mặt đồng hồ.
  - *Why*: Đảm bảo cả phụ huynh (trên laptop/điện thoại) và bé (trên đồng hồ định vị) đều có thể trải nghiệm và kiểm tra tính năng ngay lập tức mà không phụ thuộc vào phần cứng độc quyền của từng hãng đồng hồ.
  - *Alternatives Considered*: Chỉ tạo ứng dụng gốc (native APK) riêng biệt — bị loại bỏ vì không thể chạy trực tiếp và đồng bộ tức thì trên nền tảng web đa thiết bị.

- **Decision 2: Tạo mã QR SVG nội bộ không phụ thuộc dịch vụ bên thứ ba**
  - *Chosen Approach*: Xây dựng bộ tạo mã QR SVG trực tiếp phía client dựa trên mã gia đình (`Family Code`) và URL ứng dụng.
  - *Why*: Đảm bảo hoạt động 100% cả khi ngoại tuyến (offline), tốc độ hiển thị tức thì và không bao giờ gặp lỗi gãy ảnh từ các API tạo QR bên ngoài.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        KIDHERO APPLICATION STATE                        │
│     (Profile, Tasks, Stars, XP, Pet Vitality, Watch Pairing Status)     │
└───────────────┬─────────────────────────────────────────┬───────────────┘
                │                                         │
                ▼                                         ▼
┌───────────────────────────────┐         ┌───────────────────────────────┐
│   MAIN KID & PARENT VIEWS     │         │  SMARTWATCH COMPANION MODULE  │
│  • Header & SyncModal         │◄───────►│  • QR Pairing Generator       │
│  • TaskBoard & HeroBanner     │  Sync   │  • Interactive Watch Bezel UI │
│  • ParentDashboard Watch Card │         │  • Watch Face / Quests / Pet  │
└───────────────┬───────────────┘         └───────────────┬───────────────┘
                │                                         │
                └────────────────────┬────────────────────┘
                                     ▼
               ┌───────────────────────────────────────────┐
               │   REAL-TIME MULTI-DEVICE SYNC ENGINE      │
               │  • LocalStorage & BroadcastChannel        │
               │  • Express Server (/api/sync/:familyCode) │
               └───────────────────────────────────────────┘
```

- **Data Model & State**:
  - Mở rộng trạng thái đồng hồ thông minh (`WatchDeviceState`) trong dữ liệu ứng dụng:
    - Trạng thái ghép đôi (`isPaired`, `deviceName`, `lastSyncedAt`, `batteryLevel`, `locationLabel`).
    - Đồng bộ trực tiếp với mảng `tasks`, `profile.stars`, `profile.currentXp`, `profile.pet`, và `settings.dailyGoalMessage`.

- **Interactive Component & State Mapping**:
  - **Nút mở Đồng hồ & Ghép đôi QR**: Mở giao diện Đồng hồ định vị kèm thẻ hiển thị mã QR gia đình để quét liên kết nhanh.
  - **Màn hình Nhiệm vụ trên Đồng hồ (`Watch Quests`)**: Khi bé bấm vào nút tròn cạnh nhiệm vụ $\rightarrow$ gọi trực tiếp hàm `handleToggleTask(taskId)` $\rightarrow$ cập nhật trạng thái hoàn thành, cộng Sao & XP, tăng độ vui vẻ cho Rồng Con, phát âm thanh chiến thắng + giọng đọc khen ngợi, và lưu đồng bộ lên máy chủ.
  - **Màn hình Thú cưng & Lời nhắn trên Đồng hồ (`Watch Pet & Message`)**: Cho phép bé bấm nghe giọng đọc lời nhắn của ba mẹ (`speakText`) và bấm cho Rồng Con ăn táo (`handleFeedPet`) ngay trên cổ tay.
