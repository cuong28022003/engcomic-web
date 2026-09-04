import { Component, signal, input, effect, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StrategySection {
  id: string;
  number: number;
  title: string;
  summary: string;
  details: string[];
  badge?: string;
}

export interface PartStrategyData {
  part: number;
  name: string;
  questionRange: string;
  recommendedTime: string;
  timePerQuestion: string;
  color: string;
  gradient: string;
  sections: StrategySection[];
  proTips: string;
}

export const TOEIC_READING_STRATEGIES: PartStrategyData[] = [
  {
    part: 5,
    name: 'Chọn Từ Điền Vào Câu (Incomplete Sentences)',
    questionRange: 'Câu 101 - 130 (30 câu)',
    recommendedTime: '10 - 11 phút',
    timePerQuestion: '~20 giây / câu',
    color: '#38bdf8',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    sections: [
      {
        id: 'p5-1',
        number: 1,
        title: 'Quản lý thời gian',
        summary: 'Chỉ dành 10-11 phút cho 30 câu (~20s/câu). Quá 15s phân vân thì đoán và bỏ qua để dành sức cho Part 6, 7.',
        details: [
          'Chỉ nên dành khoảng <strong>10 - 11 phút</strong> cho 30 câu (trung bình <strong>~20 giây/câu</strong>).',
          'Đây là phần dễ ăn điểm nhanh nhất trong Reading — nếu mất quá 15 giây/câu mà vẫn phân vân, nên <strong>đoán và bỏ qua</strong> để không ảnh hưởng đến Part 6 và Part 7.'
        ],
        badge: 'Tốc độ vàng'
      },
      {
        id: 'p5-2',
        number: 2,
        title: 'Nguyên tắc cốt lõi: Không cần dịch cả câu',
        summary: 'Với đa số câu, chỉ đọc phần ngay trước và sau chỗ trống để xác định loại từ; chỉ dịch với câu từ vựng.',
        details: [
          'Với đa số câu, chỉ cần đọc phần câu <strong>ngay trước và sau chỗ trống</strong> để xác định loại từ cần điền — không cần hiểu trọn vẹn nghĩa cả câu.',
          'Việc dịch toàn bộ câu chỉ thực sự cần thiết với dạng <strong>từ vựng theo ngữ cảnh</strong>.'
        ],
        badge: 'Cốt lõi'
      },
      {
        id: 'p5-3',
        number: 3,
        title: 'Phân loại 4 dạng câu hỏi chính',
        summary: 'Từ loại (~40%), Ngữ pháp (thì/chia động từ/đại từ/giới từ), Liên từ vs Giới từ, và Từ vựng theo ngữ cảnh.',
        details: [
          '<strong>a. Từ loại (Word form) — phổ biến nhất (~40%):</strong> 4 đáp án cùng gốc từ. Nhìn cấu trúc xung quanh chỗ trống: Trước Danh từ cần <em>Tính từ</em>; Sau <em>to be</em> cần Tính từ/Danh từ; Bổ nghĩa Động từ cần <em>Trạng từ</em>; Sau mạo từ (a/an/the) hoặc tính từ sở hữu cần <em>Danh từ</em>. Không cần dịch nghĩa!',
          '<strong>b. Ngữ pháp:</strong> <em>Thì động từ</em> (tìm mốc thời gian: yesterday, next month, since, by the time...); <em>Chủ ngữ - Động từ</em> (chú ý số ít/số nhiều); <em>Đại từ</em> (xác định từ thay thế và vai trò chủ ngữ/tân ngữ/sở hữu/phản thân); <em>Giới từ</em> (học theo cụm collocations: responsible for, depend on, prior to...).',
          '<strong>c. Liên từ vs Giới từ:</strong> Liên từ (although, because, while, since) + Mệnh đề (S+V); Giới từ (despite, because of, during) + Cụm danh từ / V-ing. Nhìn sau chỗ trống: nếu có S+V chọn liên từ, nếu chỉ là cụm N/V-ing chọn giới từ.',
          '<strong>d. Từ vựng theo ngữ cảnh (Vocabulary):</strong> Dạng <strong>duy nhất bắt buộc phải đọc và hiểu nghĩa cả câu</strong>. 4 đáp án cùng từ loại nhưng khác nghĩa. Chú ý các cặp từ dễ gây nhầm lẫn: <em>raise</em> vs <em>rise</em>, <em>affect</em> vs <em>effect</em>.'
        ],
        badge: '4 Dạng Đề'
      },
      {
        id: 'p5-4',
        number: 4,
        title: 'Mẹo làm nhanh siêu tốc',
        summary: 'Đọc 4 đáp án trước để nhận diện dạng đề; câu dài chỉ đọc phần chứa chỗ trống và mệnh đề liên quan.',
        details: [
          '<strong>Đọc đáp án trước (4 lựa chọn)</strong> để biết ngay dạng câu hỏi: Cùng gốc từ = Từ loại; Khác nghĩa hoàn toàn = Từ vựng; Có giới từ/liên từ = Ngữ pháp — từ đó quyết định cần đọc bao nhiêu phần câu.',
          'Với câu dài, <strong>không cần đọc hết</strong> — chỉ cần tập trung vào phần chứa chỗ trống và mệnh đề trực tiếp liên quan.'
        ],
        badge: 'Mẹo làm nhanh'
      },
      {
        id: 'p5-5',
        number: 5,
        title: 'Lỗi thường gặp cần tránh',
        summary: 'Tránh chọn theo cảm tính "quen mắt", nhầm lẫn giữa Liên từ và Giới từ, và chú ý tính song song.',
        details: [
          '<strong>Chọn đáp án "quen mắt"</strong>: Đọc lướt thấy xuôi tai mà không kiểm tra lại từ loại có khớp cấu trúc ngữ pháp vị trí đó hay không.',
          '<strong>Nhầm giới từ và liên từ cùng nghĩa</strong>: Điển hình như <em>despite</em> vs <em>although</em>, <em>because of</em> vs <em>because</em>.',
          '<strong>Cấu trúc song song (Parallel structure)</strong>: Với câu có cặp liên từ tương quan (<em>not only... but also</em>, <em>either... or</em>, <em>both... and</em>), các vế phải đồng nhất về dạng ngữ pháp/từ loại.'
        ],
        badge: 'Bẫy thi'
      }
    ],
    proTips: 'Quy tắc vàng Part 5: Luôn đọc 4 đáp án trước! Nếu cùng gốc từ hoặc ngữ pháp ➔ Chỉ xét cấu trúc trước/sau chỗ trống, tuyệt đối không tốn thời gian dịch cả câu!'
  },
  {
    part: 6,
    name: 'Điền Từ Vào Đoạn Văn (Text Completion)',
    questionRange: 'Câu 131 - 146 (16 câu - 4 đoạn)',
    recommendedTime: '10 - 11 phút',
    timePerQuestion: '~40 giây / câu (~2.5 phút / đoạn)',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #7e22ce 0%, #c084fc 100%)',
    sections: [
      {
        id: 'p6-1',
        number: 1,
        title: 'Quản lý thời gian',
        summary: 'Dành khoảng 10-11 phút cho cả 16 câu (~40s/câu). Ăn điểm nhanh nếu nắm vững ngữ pháp, không sa đà.',
        details: [
          'Chỉ nên dành khoảng <strong>10 - 11 phút</strong> cho cả 16 câu (~40 giây/câu, ~2.5 phút/đoạn) để dành tối đa 55-60 phút cho Part 7.',
          'Đây là phần "ăn điểm nhanh" nếu nắm vững ngữ pháp — <strong>đừng sa đà</strong> quá lâu ở một câu khó.'
        ],
        badge: 'Chiến lược'
      },
      {
        id: 'p6-2',
        number: 2,
        title: 'Phân loại 4 dạng câu hỏi trong mỗi đoạn',
        summary: 'Mỗi đoạn có 4 dạng: Ngữ pháp thuần túy, Từ vựng, Liên từ/Từ nối và Điền cả câu văn.',
        details: [
          '<strong>Ngữ pháp thuần túy</strong> (thì động từ, từ loại, giới từ...): Giống Part 5, chỉ cần đọc <strong>câu chứa chỗ trống</strong>, không cần dịch cả đoạn.',
          '<strong>Từ vựng</strong> (4 từ loại giống nhau nhưng khác nghĩa): Cần đọc <strong>câu trước và câu sau</strong> để hiểu ngữ cảnh.',
          '<strong>Liên từ / Từ nối</strong> (However, Therefore, In addition...): Cần xác định <strong>mối quan hệ logic</strong> giữa câu trước và câu chứa chỗ trống.',
          '<strong>Điền cả câu văn vào đoạn</strong>: Dạng khó nhất, chiếm 1 câu/đoạn (tổng 4 câu). Cần nắm được <strong>mạch ý chính</strong> của cả đoạn.'
        ],
        badge: '4 Dạng Đề'
      },
      {
        id: 'p6-3',
        number: 3,
        title: 'Nguyên tắc đọc: Không đọc hết từ đầu đến cuối',
        summary: 'Đọc lướt câu đầu để nắm chủ đề/thể loại, rồi vào thẳng câu có chỗ trống; chỉ mở rộng khi cần.',
        details: [
          '<strong>Không nên đọc toàn bộ đoạn văn từ đầu đến cuối</strong> rồi mới làm — sẽ không đủ thời gian.',
          '<strong>Cách làm đúng:</strong> Đọc lướt câu đầu tiên để biết chủ đề/thể loại (Email, Thư báo, Thông báo, Quảng cáo...) ➔ Đi thẳng vào câu có chỗ trống ➔ Nếu câu đó không đủ thông tin thì mới mở rộng đọc câu trước/sau.'
        ],
        badge: 'Nguyên tắc vàng'
      },
      {
        id: 'p6-4',
        number: 4,
        title: 'Mẹo cho câu "Điền cả câu văn" (Khó nhất)',
        summary: 'Đọc kỹ câu trước/sau, tìm đại từ thay thế (this, that, they...) và làm câu này sau cùng trong đoạn.',
        details: [
          'Dạng này luôn có <strong>1 câu trong mỗi đoạn</strong> (câu 134, 138, 142, 146).',
          'Đọc kỹ <strong>câu ngay trước và câu ngay sau</strong> chỗ trống để tìm mạch logic.',
          'Chú ý các <strong>đại từ thay thế</strong> trong đáp án (<em>this, that, these, those, he, she, it, they</em>) hoặc các <strong>từ nối</strong> (<em>However, As a result</em>) — chúng phải liên kết trực tiếp với thông tin ở câu trước.',
          'Nếu câu trước nói về một vấn đề, câu sau nói về giải pháp ➔ Câu cần điền phải là sự chuyển tiếp hoặc giải thích thêm về vấn đề.',
          '<strong>Làm câu này sau cùng</strong> trong 4 câu của đoạn văn đó vì lúc này bạn đã hiểu được mạch chính của đoạn.'
        ],
        badge: 'Dạng khó nhất'
      },
      {
        id: 'p6-5',
        number: 5,
        title: 'Mẹo dạng câu "Từ nối / Liên từ" (Transitions)',
        summary: 'Xác định quan hệ logic giữa 2 câu (Tương phản, Nguyên nhân - Kết quả, Bổ sung); chú ý dấu phẩy.',
        details: [
          'Xác định mối quan hệ giữa 2 mệnh đề / 2 câu:',
          '&nbsp;• <strong>Tương phản / Đối lập:</strong> <em>However, Nevertheless, On the other hand, Although</em>',
          '&nbsp;• <strong>Nguyên nhân - Kết quả:</strong> <em>Therefore, As a result, Consequently, Because</em>',
          '&nbsp;• <strong>Bổ sung / Thêm ý:</strong> <em>Furthermore, In addition, Moreover, Besides</em>',
          '&nbsp;• <strong>Thời gian / Trình tự:</strong> <em>Meanwhile, Subsequently, First, Finally</em>',
          '<strong>Chú ý vị trí dấu câu:</strong> Nếu chỗ trống đứng đầu câu, sau đó là dấu phẩy <code>[, ]</code> ➔ Thường là trạng từ liên kết (<em>However, Therefore...</em>).'
        ],
        badge: 'Logic từ nối'
      },
      {
        id: 'p6-6',
        number: 6,
        title: 'Bẫy thì của động từ (Verb Tenses)',
        summary: 'Tìm mốc thời gian trong đoạn văn và ngày gửi Email/Notice làm mốc hiện tại để chia thì chuẩn.',
        details: [
          'Part 6 rất hay bẫy về <strong>thì của động từ</strong> dựa trên ngữ cảnh toàn đoạn văn, không chỉ riêng một câu.',
          '<strong>Mẹo tìm mốc thời gian:</strong> Tìm các mốc thời gian trong đoạn văn (ngày tháng, các từ chỉ thời gian như <em>last week, next month, currently, recently</em>).',
          '<strong>Chú ý ngày gửi của Email/Thư:</strong> Ngày này nằm ở đầu văn bản, dùng nó làm mốc hiện tại để xác định sự việc diễn ra trong quá khứ hay tương lai.'
        ],
        badge: 'Bẫy thi'
      },
      {
        id: 'p6-7',
        number: 7,
        title: 'Lời khuyên khi luyện tập & Thứ tự làm bài',
        summary: 'Tối đa 2.5 phút/đoạn. Thứ tự: Ngữ pháp/Từ vựng dễ ➔ Liên từ logic ➔ Điền cả câu làm sau cùng.',
        details: [
          'Mỗi đoạn văn làm trong <strong>tối đa 2.5 phút</strong> (4 đoạn = 10 phút).',
          'Làm theo thứ tự: <strong>Câu ngữ pháp/từ vựng dễ ➔ Câu liên từ ➔ Câu điền cả câu làm sau cùng</strong>.',
          'Đoán nhanh và bỏ qua nếu gặp câu quá khó, không để mất thời gian ảnh hưởng đến Part 7.'
        ],
        badge: 'Luyện tập'
      }
    ],
    proTips: 'Thứ tự tối ưu trong mỗi đoạn Part 6: Xử lý các câu Ngữ pháp/Từ vựng trước ➔ Câu Liên từ logic ➔ Câu điền cả câu văn làm sau cùng!'
  },
  {
    part: 7,
    name: 'Đọc Hiểu Đoạn Văn (Reading Comprehension)',
    questionRange: 'Câu 147 - 200 (54 câu)',
    recommendedTime: '55 - 60 phút',
    timePerQuestion: '~1 - 1.5 phút / câu',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)',
    sections: [
      {
        id: 'p7-1',
        number: 1,
        title: 'Quản lý thời gian',
        summary: '55 - 60 phút cho 54 câu (Single: ~1p/câu, Double/Triple: ~1.5p/câu). Không dừng quá lâu ở 1 câu khó.',
        details: [
          'Part 7 có 54 câu (147-200), nên dành khoảng <strong>55-60 phút</strong> cho phần này (trong tổng 75 phút của Reading).',
          'Đừng dừng lại quá lâu ở 1 câu khó — hãy đánh dấu (⚑) và quay lại sau nếu còn thời gian.',
          'Với <strong>Single passage</strong>: ~1 phút/câu. Với <strong>Double/Triple passages</strong>: ~1.5 phút/câu vì cần đối chiếu nhiều nguồn.'
        ],
        badge: 'Quyết định điểm số'
      },
      {
        id: 'p7-2',
        number: 2,
        title: 'Thứ tự làm bài thông minh',
        summary: 'Làm Single passage trước (147-175), Double/Triple sau (176-200). Ưu tiên bỏ qua suy luận khó nếu gấp.',
        details: [
          'Làm <strong>single passage trước</strong> (147-175) vì bài ngắn, thông tin trực diện, dễ và nhanh hơn.',
          'Làm <strong>double/triple passages sau</strong> (176-200) vì cần thời gian đối chiếu thông tin giữa các văn bản.',
          'Nếu thời gian gấp, ưu tiên bỏ qua các câu hỏi suy luận khó (inference) ở phần cuối để ăn chắc các câu dễ.'
        ]
      },
      {
        id: 'p7-3',
        number: 3,
        title: 'Quy trình 4 bước làm bài thực chiến',
        summary: '1. Nhận diện văn bản ➔ 2. Đọc câu hỏi lấy Keyword ➔ 3. Quét định vị đoạn văn ➔ 4. Đối chiếu Paraphrase.',
        details: [
          '<strong>Bước 1 - Nhận diện cấu trúc văn bản (2-3s):</strong> Nhìn nhanh tiêu đề, hình thức (đơn/kép/ba) và dòng tiêu đề/người gửi để kích hoạt ngữ cảnh tương ứng.',
          '<strong>Bước 2 - Đọc câu hỏi & gạch chân Keyword (10-15s):</strong> Đọc câu hỏi trước (không đọc 4 đáp án). Gạch chân từ khóa định vị: Tên riêng viết hoa, con số, ngày tháng, thuật ngữ chuyên ngành.',
          '<strong>Bước 3 - Quét (Scanning) & định vị đoạn văn (20-30s):</strong> Rà nhanh mắt theo hình chữ Z để tìm khu vực chứa từ khóa hoặc từ đồng nghĩa. Với đoạn kép/ba, xác định câu hỏi thuộc bài đọc 1, 2 hay kết hợp cả hai.',
          '<strong>Bước 4 - Đọc kỹ ngữ cảnh, đối chiếu Paraphrase (15-20s):</strong> Đọc kỹ 1-2 câu xung quanh vị trí định vị. Tìm phương án đã được diễn đạt lại (Paraphrase) bằng từ đồng nghĩa; cảnh giác đáp án sao chép nguyên văn nhưng sai ngữ cảnh.'
        ],
        badge: 'Quy trình 4 bước'
      },
      {
        id: 'p7-4',
        number: 4,
        title: 'Phân loại 6 dạng văn bản thường gặp',
        summary: 'Email/Letter, Memo/Notice, Quảng cáo (Ad), Bài báo (Article), Bảng biểu/Hóa đơn và Đoạn chat trực tuyến.',
        details: [
          '<strong>1. Email / Letter (Thư từ - phổ biến nhất):</strong> Xem dòng Subject và 1-2 câu đầu để biết mục đích gửi thư (hỏi hàng, khiếu nại, phản hồi, mời họp). Chú ý ngày gửi.',
          '<strong>2. Memo / Notice / Announcement (Thông báo nội bộ & công cộng):</strong> Thường nói về quy định mới, thăng chức, bảo trì, lịch nghỉ. Chú ý đối tượng áp dụng (To all staff...) và thời hạn thực hiện.',
          '<strong>3. Advertisement / Flyer (Quảng cáo, tờ rơi):</strong> Giới thiệu sản phẩm/dịch vụ/tuyển dụng. Quét nhanh giá tiền, điều kiện ưu đãi (discount, coupon, special offer), thời hạn và liên hệ.',
          '<strong>4. Article / Review (Bài báo, đánh giá):</strong> Văn phong học thuật, câu dài. Đọc tiêu đề (Headline) và đoạn đầu để nắm ý chính; không hoang mang trước từ vựng chuyên ngành.',
          '<strong>5. Form / Invoice / Schedule / Webpage (Bảng biểu, hóa đơn, lịch trình):</strong> Dạng bảng ít chữ, nhiều số liệu. Quét trực tiếp theo keyword; đặc biệt lưu ý <em>dấu hoa thị (*) hoặc dòng ghi chú nhỏ ở chân trang</em> vì rất hay bị hỏi.',
          '<strong>6. Text Message Chain / Online Chat (Chuỗi tin nhắn):</strong> Hội thoại 2-3 người. Thường có câu hỏi: <em>Tại thời điểm XX:XX, người A ngụ ý gì?</em> ➔ Phải đọc câu nói ngay trước đó của người đối diện để suy ra ngữ cảnh.'
        ],
        badge: '6 Dạng Văn Bản'
      },
      {
        id: 'p7-5',
        number: 5,
        title: 'Phân loại 6 dạng câu hỏi cốt lõi',
        summary: 'Nhận diện: Chi tiết (What/When), Ý chính, Suy luận (Inference), Từ vựng ngữ cảnh, NOT/TRUE, Điền câu.',
        details: [
          '<strong>Câu hỏi chi tiết (What/When/Who/Why):</strong> tìm từ khóa (keyword) trong câu hỏi, quét (scan) đoạn văn để tìm từ đó hoặc từ đồng nghĩa.',
          '<strong>Câu hỏi ý chính (main idea/purpose):</strong> đọc câu đầu và câu cuối của đoạn/email, thường chứa ý chính.',
          '<strong>Câu hỏi suy luận (inference - "what is suggested/implied"):</strong> không có đáp án nói thẳng, cần suy ra từ ngữ cảnh — đây là dạng khó và tốn thời gian nhất.',
          '<strong>Câu hỏi từ vựng (word closest in meaning to...):</strong> dựa vào ngữ cảnh câu chứa từ đó, không chỉ dựa nghĩa từ điển thông thường.',
          '<strong>Câu hỏi "NOT/TRUE" (loại trừ):</strong> đối chiếu từng đáp án với đoạn văn, loại dần — đây là dạng tốn thời gian nhất, nên làm sau cùng nếu gấp.',
          '<strong>Câu hỏi điền câu vào đoạn văn ("insert sentence"):</strong> chú ý các từ nối (however, therefore, in addition...), đại từ (this, that, it) để xác định vị trí logic.'
        ],
        badge: '6 Dạng Câu Hỏi'
      },
      {
        id: 'p7-6',
        number: 6,
        title: 'Kỹ thuật Skimming & Scanning',
        summary: 'Skimming đọc lướt nắm ý chính & thể loại; Scanning quét nhanh từ khóa cụ thể (tên riêng, số liệu).',
        details: [
          '<strong>Skimming:</strong> đọc lướt để nắm ý chính, loại văn bản (email, thông báo, quảng cáo...), người gửi/nhận.',
          '<strong>Scanning:</strong> quét tìm từ khóa cụ thể (tên riêng, ngày tháng, số liệu, vị trí) khi trả lời câu hỏi chi tiết.'
        ]
      },
      {
        id: 'p7-7',
        number: 7,
        title: 'Xử lý Double / Triple Passages',
        summary: 'Chú ý liên kết chéo giữa các bài đọc. Luôn có 1-2 câu kết hợp thông tin 2 văn bản mới ra đáp án.',
        details: [
          'Chú ý các thông tin <strong>liên kết chéo</strong> giữa các văn bản (VD: 1 email hỏi, 1 email trả lời, hoặc 1 thông báo + 1 form đăng ký).',
          'Thường có <strong>1-2 câu</strong> yêu cầu kết hợp thông tin từ 2 văn bản khác nhau mới trả lời được — đây là điểm đặc trưng khó của dạng bài này.'
        ],
        badge: 'Đoạn kép & ba'
      },
      {
        id: 'p7-8',
        number: 8,
        title: 'Nhận diện bẫy "Paraphrase"',
        summary: 'Đáp án đúng thường diễn đạt lại bằng từ đồng nghĩa; cảnh giác đáp án chứa từ y hệt bài đọc.',
        details: [
          'TOEIC hiếm khi lặp lại nguyên văn — đáp án đúng thường là <strong>diễn đạt lại (paraphrase)</strong> ý trong bài đọc bằng từ khác.',
          'Luyện tập nhận diện từ đồng nghĩa (synonyms) là kỹ năng cốt lõi nhất để bứt phá band điểm.',
          'Đáp án chứa từ y hệt trong bài đọc thường là bẫy gây nhiễu, hãy đối chiếu kỹ ngữ nghĩa.'
        ],
        badge: 'Tránh bẫy'
      },
      {
        id: 'p7-9',
        number: 9,
        title: 'Chiến lược luyện tập & Review',
        summary: 'Luyện đề theo áp lực thời gian thực tế; sau khi nộp bài phân tích kỹ nguyên nhân gốc rễ của câu sai.',
        details: [
          'Làm đề theo <strong>thời gian giới hạn</strong> thường xuyên để quen áp lực phòng thi.',
          'Sau khi làm xong, phân tích lỗi sai kỹ — xem là lỗi do từ vựng, do đọc sai ý, hay do quản lý thời gian.'
        ]
      }
    ],
    proTips: 'Nếu sắp hết giờ, hãy ưu tiên làm các câu hỏi tìm chi tiết cụ thể (Thời gian, Tên người, Địa điểm) trước các câu hỏi suy luận (Inference/Main idea)!'
  }
];

@Component({
  selector: 'app-part-strategy-popover',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './part-strategy-popover.component.html',
  styleUrls: ['./part-strategy-popover.component.scss']
})
export class PartStrategyPopoverComponent {
  private elementRef = inject(ElementRef);

  readonly initialPart = input<number>(6);

  readonly strategies = signal<PartStrategyData[]>(TOEIC_READING_STRATEGIES);
  readonly selectedPart = signal<number>(6);
  readonly isOpen = signal<boolean>(false);
  readonly activeTooltipId = signal<string | null>(null);

  constructor() {
    effect(() => {
      const part = this.initialPart();
      if (part && [5, 6, 7].includes(part)) {
        this.selectedPart.set(part);
      }
    });
  }

  readonly currentStrategy = () => {
    return this.strategies().find(s => s.part === this.selectedPart()) || this.strategies()[1];
  };

  private closeTimeout: any = null;

  toggleOpen(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
    this.isOpen.update(v => !v);
  }

  openPopover(): void {
    this.cancelClose();
    this.isOpen.set(true);
  }

  scheduleClose(delayMs = 350): void {
    this.cancelClose();
    this.closeTimeout = setTimeout(() => {
      this.isOpen.set(false);
      this.activeTooltipId.set(null);
      this.closeTimeout = null;
    }, delayMs);
  }

  cancelClose(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }

  closePopover(): void {
    this.cancelClose();
    this.isOpen.set(false);
    this.activeTooltipId.set(null);
  }

  selectPart(part: number): void {
    this.selectedPart.set(part);
    this.activeTooltipId.set(null);
  }

  showDetail(id: string): void {
    this.activeTooltipId.set(id);
  }

  hideDetail(): void {
    this.activeTooltipId.set(null);
  }

  toggleDetail(id: string): void {
    this.activeTooltipId.update(current => (current === id ? null : id));
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.closePopover();
    }
  }
}
