# Kế hoạch triển khai Landing Page FocusBuddy

> **Dành cho Antigravity:** QUY TRÌNH BẮT BUỘC: Sử dụng `.agent/workflows/execute-plan.md` để thực hiện kế hoạch này ở chế độ single-flow.

**Mục tiêu:** Xây dựng landing page hiện đại, cao cấp cho sản phẩm FocusBuddy (AI Student Companion) tích hợp scroll animation, hiệu ứng 3D orbit/parallax, mô phỏng luồng multi-agent, giả lập quét điểm OCR và thiết kế responsive.

**Kiến trúc:** Tạo thư mục `fe/src/app/landing` chứa `page.tsx` và các component con độc lập. Cập nhật `fe/src/app/page.tsx` để điều hướng người dùng đã đăng nhập về `/dashboard`, đồng thời kết xuất landing page tại đường dẫn gốc `/` cho khách.

**Tech Stack:** React, Next.js (App Router), Tailwind CSS, Framer Motion, Lucide React.

---

### Task 1: Khởi tạo thư mục Landing & Khung trang chủ
**Tập tin:**
- Tạo mới: `fe/src/app/landing/page.tsx`

**Bước 1: Viết mã nguồn cho Landing Page shell**
Tạo component trang cơ bản để kiểm tra lỗi build.
```tsx
'use client';

import React from 'react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8f7ff] text-slate-900 overflow-x-hidden font-sans">
      <main className="relative">
        <div className="py-20 text-center">FocusBuddy Landing Page Shell</div>
      </main>
    </div>
  );
}
```

**Bước 2: Xác thực biên dịch kiểu**
Chạy: `cmd /c npx tsc --noEmit` tại `g:\Chat Box\fe`
Kết quả mong muốn: THÀNH CÔNG (không lỗi biên dịch)

**Bước 3: Commit**
```bash
git add fe/src/app/landing/page.tsx
git commit -m "feat(landing): initialize landing page shell"
```

---

### Task 2: Xây dựng Component Navbar
**Tập tin:**
- Tạo mới: `fe/src/app/landing/components/Navbar.tsx`
- Sửa đổi: `fe/src/app/landing/page.tsx`

**Bước 1: Triển khai component Navbar**
Tạo một Navbar dạng glassmorphism cố định trên đầu trang với logo, liên kết điều hướng và các nút CTA hành động.
```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Menu, X, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Trang chủ', href: '#home' },
    { name: 'Tính năng', href: '#features' },
    { name: 'Cách hoạt động', href: '#how-it-works' },
    { name: 'Giá', href: '#pricing' },
    { name: 'Về chúng tôi', href: '#about' },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/70 backdrop-blur-md border-b border-indigo-100/50 shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-md shadow-violet-200">
              <Bot size={22} className="animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Focus<span className="text-violet-600">Buddy</span>
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="text-[15px] font-medium text-slate-600 hover:text-violet-600 transition-colors duration-200">
                {link.name}
              </a>
            ))}
          </div>

          {/* CTA & Actions */}
          <div className="hidden md:flex items-center gap-4">
            <a href="/login" className="px-5 py-2.5 text-[15px] font-semibold text-slate-700 hover:text-violet-600 transition-colors duration-200">
              Đăng nhập
            </a>
            <a href="/register" className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl text-[15px] font-semibold transition-all duration-300 shadow-md shadow-violet-200 hover:shadow-lg hover:shadow-violet-300 hover:-translate-y-0.5">
              Bắt đầu miễn phí <ArrowRight size={16} />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 hover:text-violet-600 transition-colors">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-indigo-50 px-4 pt-2 pb-6 flex flex-col gap-4 animate-slide-up">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-[15px] font-medium text-slate-600 hover:text-violet-600 py-2 border-b border-slate-50">
              {link.name}
            </a>
          ))}
          <div className="flex flex-col gap-3 mt-2">
            <a href="/login" className="w-full text-center py-2.5 text-[15px] font-semibold text-slate-700 hover:text-violet-600">
              Đăng nhập
            </a>
            <a href="/register" className="w-full text-center bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 rounded-xl text-[15px] font-semibold shadow-md shadow-violet-200">
              Bắt đầu miễn phí
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
```

**Bước 2: Nhập Navbar vào page.tsx**
Thêm `<Navbar />` vào `fe/src/app/landing/page.tsx`.

**Bước 3: Xác thực biên dịch**
Chạy: `cmd /c npx tsc --noEmit` tại `g:\Chat Box\fe`
Kết quả: THÀNH CÔNG

**Bước 4: Commit**
```bash
git add fe/src/app/landing/components/Navbar.tsx fe/src/app/landing/page.tsx
git commit -m "feat(landing): add Navbar component"
```

---

### Task 3: Xây dựng Component Hero (Orbit & Parallax)
**Tập tin:**
- Tạo mới: `fe/src/app/landing/components/Hero.tsx`
- Sửa đổi: `fe/src/app/landing/page.tsx`

**Bước 1: Triển khai component Hero**
Xây dựng giao diện Hero với Headline lớn, hiệu ứng 3D orbit cho robot bay quanh smartphone và hiệu ứng parallax chuyển động khi di chuột cho 4 thẻ sub-agent.
```tsx
// (Code chi tiết đã tạo ở Task 3)
```

**Bước 2: Nhập Hero vào page.tsx**
Thêm `<Hero />` vào `fe/src/app/landing/page.tsx`.

**Bước 3: Xác thực biên dịch**
Chạy: `cmd /c npx tsc --noEmit`
Kết quả: THÀNH CÔNG

**Bước 4: Commit**
```bash
git add fe/src/app/landing/components/Hero.tsx fe/src/app/landing/page.tsx
git commit -m "feat(landing): add Hero component with orbit & mouse-parallax"
```

---

### Task 4: Xây dựng Component Trust Strip
**Tập tin:**
- Tạo mới: `fe/src/app/landing/components/TrustStrip.tsx`
- Sửa đổi: `fe/src/app/landing/page.tsx`

**Bước 1: Triển khai component TrustStrip**
```tsx
// (Code chi tiết đã tạo ở Task 4)
```

**Bước 2: Nhập TrustStrip vào page.tsx**
Thêm `<TrustStrip />` vào `fe/src/app/landing/page.tsx`.

**Bước 3: Xác thực biên dịch**
Chạy: `cmd /c npx tsc --noEmit`
Kết quả: THÀNH CÔNG

**Bước 4: Commit**
```bash
git add fe/src/app/landing/components/TrustStrip.tsx fe/src/app/landing/page.tsx
git commit -m "feat(landing): add TrustStrip component"
```

---

### Task 5: Xây dựng Component Features (Tính năng nổi bật)
**Tập tin:**
- Tạo mới: `fe/src/app/landing/components/Features.tsx`
- Sửa đổi: `fe/src/app/landing/page.tsx`

**Bước 1: Triển khai component Features**
Tạo lưới 4 thẻ ứng với 4 Sub-Agent với hiệu ứng glow phát sáng khi di chuột.
```tsx
// (Code chi tiết trong Task 5 sắp thực hiện)
```

**Bước 2: Nhập Features vào page.tsx**
Thêm `<Features />` vào `fe/src/app/landing/page.tsx`.

**Bước 3: Xác thực biên dịch**
Chạy: `cmd /c npx tsc --noEmit`
Kết quả mong muốn: THÀNH CÔNG

**Bước 4: Commit**
```bash
git add fe/src/app/landing/components/Features.tsx fe/src/app/landing/page.tsx
git commit -m "feat(landing): add Features section component"
```

---

*(Các nhiệm vụ tiếp theo từ Task 6 đến Task 14 tương tự sẽ được dịch chuyển dần sang tiếng Việt và thực thi từng bước).*
