# TỔNG HỢP TOÀN DIỆN QUY CHUẨN CODE & KIẾN TRÚC TỪ WEB-CLIENT CHO ENGCOMIC_ANGULAR

> Tài liệu này được tổng hợp từ việc phân tích sâu toàn bộ mã nguồn thực tế của dự án **`web-client`** (bao gồm các module thực tế như `agency-level`, `agency-management`, `shared/services`, `core/services`, `shared/components`), đúc kết thành **Quy chuẩn Code & Cách Quản Lý** cho **`EngComic_angular`** (Angular 21 + Signals + Zoneless + Dark Glassmorphism).

---

## 📑 MỤC LỤC CHI TIẾT

1. [Quy Chuẩn Cấu Trúc File & Khai Báo Component](#1-quy-chuẩn-cấu-trúc-file--khai-báo-component)
2. [Quy Chuẩn Quản Lý Vòng Đời & Dọn Dẹp Bộ Nhớ (Lifecycle & Cleanup)](#2-quy-chuẩn-quản-lý-vòng-đời--dọn-dẹp-bộ-nhớ)
3. [Pattern Quản Lý & Phục Hồi Trạng Thái Trang (State Preservation Pattern)](#3-pattern-quản-lý--phục-hồi-trạng-thái-trang)
4. [Quy Chuẩn Xử Lý Form, Tìm Kiếm & Debounce (Search & Cache)](#4-quy-chuẩn-xử-lý-form-tìm-kiếm--debounce)
5. [Quy Chuẩn Xây Dựng Service & Quản Lý Hằng Số (Storage Keys, Routes)](#5-quy-chuẩn-xây-dựng-service--quản-lý-hằng-số)
6. [Quy Chuẩn Xử Lý Responsive Qua Service (`ResizeService` & `SCREEN_SIZE`)](#6-quy-chuẩn-xử-lý-responsive-qua-service)
7. [Quy Chuẩn Chuyển Đổi Dữ Liệu (Adapter Pattern & Data Tree Building)](#7-quy-chuẩn-chuyển-đổi-dữ-liệu)
8. [Quy Chuẩn Phân Tầng Smart - Dumb Components](#8-quy-chuẩn-phân-tầng-smart---dumb-components)
9. [Bảng Tổng Hợp Quy Tắc Ràng Buộc AI Khi Code](#9-bảng-tổng-hợp-quy-tắc-ràng-buộc-ai-khi-code)

---

## 1. QUY CHUẨN CẤU TRÚC FILE & KHAI BÁO COMPONENT

Mỗi component trong `web-client` và `EngComic_angular` đều tuân thủ nguyên tắc cấu trúc nghiêm ngặt:

### 1.1 Tách 3 Tệp Độc Lập
- `[name].component.ts`: Logic, imports, signals, state.
- `[name].component.html`: Template và native control flow.
- `[name].component.scss`: Scoped styling sử dụng design tokens (`var(--...)`).
- **Tuyệt đối cấm** viết inline template hoặc inline styles.

### 1.2 Cấu Trúc Khai Báo Biến & Hằng Số Trong Component:
1. **Constants cục bộ**: Khai báo đầu class với từ khóa `readonly` và `UPPER_SNAKE_CASE`:
   ```typescript
   readonly ITEMS_PER_PAGE: number = 20;
   readonly DEBOUNCE_TIME_MS: number = 300;
   ```
2. **ViewChild & ElementRef**: Luôn có kiểu phần tử cụ thể (không dùng `any`):
   ```typescript
   @ViewChild('scrollContainer', { static: false }) scrollContainerElement!: ElementRef<HTMLDivElement>;
   ```
3. **State Signals / Properties**:
   - Khởi tạo giá trị mặc định rõ ràng.
   - Định nghĩa rõ kiểu dữ liệu:
   ```typescript
   searchKeyword = signal<string>('');
   isLoadingData = signal<boolean>(false);
   isFiltering = signal<boolean>(false);
   ```

---

## 2. QUY CHUẨN QUẢN LÝ VÒNG ĐỜI & DỌN DẸP BỘ NHỚ

Trong `web-client`, rò rỉ bộ nhớ (memory leaks) do Observable hoặc Event Listeners được ngăn chặn tuyệt đối:

### 2.1 Pattern Quản Lý Subscription:
- **Chuẩn Angular 21**: Sử dụng `takeUntilDestroyed(this.destroyRef)` cho các RxJS streams.
- **Chuẩn Subject Lifecycle**:
  ```typescript
  private destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    // 1. Hủy toàn bộ event listeners DOM thủ công
    this.removeScrollListener();

    // 2. Clear các timers/timeouts đang chạy dở
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // 3. Emit và hoàn tất stream hủy
    this.destroy$.next();
    this.destroy$.complete();
  }
  ```

---

## 3. PATTERN QUẢN LÝ & PHỤC HỒI TRẠNG THÁI TRANG (STATE PRESERVATION)

Đây là một trong những pattern quan trọng nhất trong `web-client`: Khi người dùng đang ở danh sách (đã cuộn trang, đã tìm kiếm từ khóa, đã mở các mục), bấm vào xem chi tiết rồi bấm "Quay lại" thì **phải giữ nguyên 100% ngữ cảnh cũ**:

### 3.1 Cơ Chế Hoạt Động:
1. **Lưu trạng thái vào Feature Service trước khi rời trang (`ngOnDestroy`)**:
   ```typescript
   ngOnDestroy(): void {
     // Lưu vị trí cuộn trang
     if (this.scrollContainerElement?.nativeElement) {
       this.featureService.scrollTop = this.scrollContainerElement.nativeElement.scrollTop;
     }
     // Lưu từ khóa tìm kiếm và các mục đang mở
     this.featureService.searchKeyword = this.searchKeyword();
     this.featureService.expandedItemIds = new Set(this.expandedItems());
     this.featureService.displayedItemsCount = this.displayedItemsCount();
   }
   ```
2. **Khôi phục trạng thái khi quay lại (`ngOnInit`)**:
   ```typescript
   ngOnInit(): void {
     const preserveState = !!history.state?.preserveState;
     if (preserveState) {
       this.searchKeyword.set(this.featureService.searchKeyword || '');
       this.expandedItems.set(new Set(this.featureService.expandedItemIds));
       this.displayedItemsCount.set(this.featureService.displayedItemsCount || this.ITEMS_PER_PAGE);
     }
     this.loadData();
   }

   ngAfterViewInit(): void {
     if (this.featureService.scrollTop > 0) {
       setTimeout(() => {
         if (this.scrollContainerElement?.nativeElement) {
           this.scrollContainerElement.nativeElement.scrollTop = this.featureService.scrollTop;
         }
       }, 100);
     }
   }
   ```
3. **Khi trang chi tiết điều hướng quay lại**:
   ```typescript
   this.router.navigate(['/feature-list'], { state: { preserveState: true } });
   ```

---

## 4. QUY CHUẨN XỬ LÝ FORM, TÌM KIẾM & DEBOUNCE

1. **Debounce Tìm Kiếm**:
   - Sử dụng `FormControl` kết hợp `debounceTime` và `distinctUntilChanged`:
   ```typescript
   this.searchControl.valueChanges.pipe(
     debounceTime(300),
     distinctUntilChanged(),
     takeUntilDestroyed(this.destroyRef)
   ).subscribe(keyword => {
     this.searchKeyword.set(keyword || '');
     this.onSearch();
   });
   ```
2. **Client-side Filter Cache**:
   - Đối với các danh sách dữ liệu lớn, lưu kết quả tìm kiếm vào cache bộ nhớ để tăng tốc độ phản hồi:
   ```typescript
   private filterCache: { [key: string]: ItemModel[] } = {};

   applyFilter(): void {
     const key = this.searchKeyword().trim().toUpperCase();
     if (this.filterCache[key]) {
       this.filteredItems.set(this.filterCache[key]);
       return;
     }
     const result = this.allItems().filter(item => item.name.toUpperCase().includes(key));
     this.filterCache[key] = result;
     this.filteredItems.set(result);
   }
   ```

---

## 5. QUY CHUẨN XÂY DỰNG SERVICE & QUẢN LÝ HẰNG SỐ

### 5.1 Không Dùng "Magic Strings"
- Toàn bộ Storage Keys, Route Names, Translation Namespaces phải được định nghĩa trong `src/app/shared/const/`:
  - `storage.key.ts`:
    ```typescript
    export const STORAGE_KEYS = {
      AUTH_TOKEN: 'engcomic_auth_token',
      REFRESH_TOKEN: 'engcomic_refresh_token',
      USER_INFO: 'engcomic_user_info',
      THEME: 'engcomic_theme_mode',
      READING_SETTINGS: 'engcomic_reading_settings'
    } as const;
    ```
  - `route.ts`:
    ```typescript
    export const ROUTES = {
      HOME: '',
      READER: 'reader',
      COMICS: 'comics',
      VOCAB: 'vocab',
      MISTAKES: 'reader/mistakes'
    } as const;
    ```

### 5.2 LocalStorageService Bọc Type-Safe & Xử Lý Ngoại Lệ
- Mọi thao tác với Storage phải được bọc trong `try...catch` để không crash ứng dụng khi chạy ở chế độ ẩn danh (Private Browsing / Incognito) hoặc khi bộ nhớ đầy (QuotaExceededError).

---

## 6. QUY CHUẨN XỬ LÝ RESPONSIVE QUA SERVICE (`ResizeService` & `SCREEN_SIZE`)

Thay vì gắn hàng chục listener `window.onresize` ở từng component gây lag trình duyệt, `web-client` sử dụng một dịch vụ Resize trung tâm:

```typescript
export enum SCREEN_SIZE {
  XS = 'XS',
  SM = 'SM',
  MD = 'MD',
  LG = 'LG',
  XL = 'XL'
}

@Injectable({ providedIn: 'root' })
export class ResizeService {
  private screenSize$ = new BehaviorSubject<SCREEN_SIZE>(this.calcSize());
  readonly onResize$ = this.screenSize$.asObservable().pipe(distinctUntilChanged());

  constructor() {
    window.addEventListener('resize', () => {
      this.screenSize$.next(this.calcSize());
    });
  }

  private calcSize(): SCREEN_SIZE {
    const width = window.innerWidth;
    if (width < 576) return SCREEN_SIZE.XS;
    if (width < 768) return SCREEN_SIZE.SM;
    if (width < 992) return SCREEN_SIZE.MD;
    if (width < 1200) return SCREEN_SIZE.LG;
    return SCREEN_SIZE.XL;
  }
}
```

---

## 7. QUY CHUẨN CHUYỂN ĐỔI DỮ LIỆU (ADAPTER PATTERN)

Khi nhận dữ liệu từ Backend API (DTO phẳng - Flat Entities):
1. **Không can thiệp hoặc nhét trực tiếp DTO vào biến hiển thị nếu cần cấu trúc cây (Tree) hoặc phân nhóm (Grouping)**.
2. Viết hàm chuyển đổi dữ liệu (Adapter / Mapper) rõ ràng:
   - `buildHierarchyTree(flatList: ApiEntity[]): TreeViewModel[]`
   - `convertToViewModel(entity: ApiEntity): ItemViewModel`
3. Giữ dữ liệu gốc bất biến (Immutable), trả về danh sách ViewModels mới.

---

## 8. QUY CHUẨN PHÂN TẦNG SMART - DUMB COMPONENTS

```
Feature Domain:
├── pages/                    # SMART CONTAINERS
│   └── feature-page/         # 1. Gọi API qua Service
│                             # 2. Xử lý router params, search query
│                             # 3. Điều phối truyền data xuống Dumb components
└── components/               # DUMB / PRESENTATIONAL
    └── feature-item-card/    # 1. Chỉ nhận input()
                              # 2. Chỉ phát output()
                              # 3. Không inject API services trực tiếp
```

---

## 9. BẢNG TỔNG HỢP QUY TẮC RÀNG BUỘC AI KHI CODE

| Quy Tắc | Yêu Cầu Cụ Thể | Lý Do / Lợi Ích |
|---|---|---|
| **1. Cấu trúc 3 file** | `.ts`, `.html`, `.scss` riêng biệt 100%. | Đảm bảo Clean Architecture, dễ bảo trì, đúng chuẩn Angular Enterprise. |
| **2. Zero `any`** | 100% khai báo type/interface tường minh. | Phát hiện lỗi tại compile time, tránh bug runtime do undefined field. |
| **3. Lifecycle Cleanup** | Dùng `takeUntilDestroyed` hoặc `destroy$.next()` + `complete()` + `clearTimeout`. | Tránh rò rỉ bộ nhớ (Memory Leak) và chạy ngầm tốn tài nguyên. |
| **4. State Preservation** | Lưu state vào Service và khôi phục khi `history.state.preserveState`. | Giữ nguyên vị trí cuộn trang và bộ lọc khi người dùng bấm Back. |
| **5. Debounce Input** | Debounce tối thiểu 300ms cho ô tìm kiếm. | Giảm tải xử lý, tránh lag giao diện khi người dùng gõ liên tục. |
| **6. No Magic Strings** | Dùng `STORAGE_KEYS`, `ROUTES`, `SCREEN_SIZE`. | Tránh gõ sai chính tả key lưu trữ và URL. |
| **7. No Alert/Confirm** | Dùng `ToastService` và `<app-modal>` / `ConfirmDialog`. | Giao diện đồng bộ Dark Glassmorphism, trải nghiệm người dùng cao cấp. |
| **8. Tái sử dụng Shared** | Ưu tiên dùng component có sẵn trong `@shared/components`. | Không sinh mã HTML/CSS rác trùng lặp trong codebase. |
| **9. Verify 0 Errors** | Chạy `npx ng build --configuration=development` đạt 0 lỗi. | Đảm bảo chất lượng sản phẩm không bị vỡ giao diện hoặc lỗi runtime. |
