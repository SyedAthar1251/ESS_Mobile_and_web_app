import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import ThemeSelector from "../../components/ThemeSelector";
import {
  EMPLOYEE_PAGE_CONTAINER,
  getPageCardStyle,
} from "../../utils/pageCardStyles";

// Learn More content data
const learnMoreContent = {
  aboutAlphax: {
    title: {
      en: "About Alphax",
      ar: "عن ألفاكس"
    },
    content: {
      en: "Alphax is a leading provider of enterprise solutions, specializing in HR management systems, attendance tracking, and employee self-service applications. Our mission is to simplify workplace operations through innovative technology.\n\nFounded in 2020, we serve hundreds of organizations across various industries, helping them streamline their HR processes and improve employee productivity.",
      ar: "ألفاكس هي المزود الرائد لحلول المؤسسات، متخصصة في أنظمة إدارة الموارد البشرية وتتبع الحضور وتطبيقات الخدمة الذاتية للموظفين. مهمتنا هي تبسيط عمليات مكان العمل من خلال التكنولوجيا المبتكرة.\n\nتأسست في عام 2020، نخدم مئات المؤسسات في مختلف الصناعات،，帮助هم تحسين عمليات الموارد البشرية وزيادة إنتاجية الموظفين."
    }
  },
  faq: {
    title: {
      en: "FAQ",
      ar: "الأسئلة الشائعة"
    },
    content: {
      en: "Q: How do I punch in/out?\nA: Use the punch slider on the dashboard to check in or out. Make sure location services are enabled.\n\nQ: How do I apply for leave?\nA: Navigate to the Leave section and fill out the leave application form.\n\nQ: Can I view my salary slip?\nA: Yes, go to the Salary section to view your salary slips.\n\nQ: How do I reset my password?\nA: Contact your HR administrator to reset your password.\n\nQ: Is my location data secure?\nA: Yes, we use encrypted connections and your location data is only used for attendance verification.",
      ar: "س: كيف أتسجيل الدخول/الخروج؟\nج: استخدم شريط التمرير في لوحة التحكم للتسجيل. تأكد من تمكين خدمات الموقع.\n\nس: كيف أقدم طلب إجازة؟\nج: انتقل إلى قسم الإجازات واملأ نموذج طلب الإجازة.\n\nس: هل يمكنني观看كشف الراتب؟\nج: نعم، انتقل إلى قسم الراتب لمشاهدة كشوف الراتب.\n\nس: كيف أعيد تعيين كلمة المرور؟\nج: اتصل بمسؤول الموارد البشرية لإعادة تعيين كلمة المرور.\n\nس: هل بيانات الموقع الخاصة بي آمنة؟\nج: نعم، نستخدم اتصالات مشفرة وبيانات الموقع الخاصة بك تُستخدم فقط للتحقق من الحضور."
    }
  },
  privacyPolicy: {
    title: {
      en: "Privacy Policy",
      ar: "سياسة الخصوصية"
    },
    content: {
      en: "Privacy Policy\n\nLast Updated: March 2026\n\n1. Data Collection\nWe collect personal information including your name, employee ID, attendance records, and location data when you use the app for punch in/out.\n\n2. Data Usage\nYour data is used solely for:\n- Attendance tracking and verification\n- HR management purposes\n- Compliance with labor regulations\n\n3. Data Security\nWe implement industry-standard security measures to protect your data, including encryption and secure servers.\n\n4. Data Sharing\nYour data is shared only with your organization and relevant authorities as required by law.\n\n5. Your Rights\nYou have the right to access, correct, or delete your personal data. Contact your HR department for such requests.",
      ar: "سياسة الخصوصية\n\nآخر تحديث: مارس 2026\n\n1. جمع البيانات\nنجمع المعلومات الشخصية بما في ذلك اسمك ورقمEmployee ID وسجلات الحضور وبيانات الموقع عندما تستخدم التطبيق لتسجيل الدخول/الخروج.\n\n2. استخدام البيانات\nتُستخدم بياناتك فقط لـ:\n- تتبع والتحقق من الحضور\n- أغراض إدارة الموارد البشرية\n- الامتثال للوائح العمل\n\n3. أمان البيانات\nننفذ تدابير أمان معيارية الصناعة لحماية بياناتك، بما في ذلك التشفير والخوادم الآمنة.\n\n4. مشاركة البيانات\nيتم مشاركة بياناتك فقط مع مؤسستك والسلطات المختصة حسب ما يقتضي القانون.\n\n5. حقوقك\nلديك الحق في الوصول إلى بياناتك الشخصية أو تصحيحها أو حذفها. اتصل بقسم الموارد البشرية لمثل هذه الطلبات."
    }
  },
  userGuide: {
    title: {
      en: "User Guide",
      ar: "دليل المستخدم"
    },
    content: {
      en: "User Guide\n\nGetting Started:\n1. Login with your company credentials\n2. Grant location permissions for attendance tracking\n3. Complete your profile setup\n\nPunch In/Out:\n1. Open the dashboard\n2. Use the punch slider to check in or out\n3. Ensure you're at your designated work location\n\nApplying for Leave:\n1. Go to Leave section\n2. Select leave type and dates\n3. Add reason and submit\n\nViewing Documents:\n1. Navigate to Documents section\n2. View your uploaded documents\n3. Download or share as needed\n\nTips:\n- Keep your location services enabled\n- Sync your attendance regularly\n- Check notifications for updates",
      ar: "دليل المستخدم\n\nالبدء:\n1. تسجيل الدخول باستخدام بيانات اعتماد شركتك\n2. منح أذونات الموقع لتتبع الحضور\n3. إكمال إعداد ملفك الشخصي\n\nالتسجيل في/الخروج:\n1. افتح لوحة التحكم\n2. استخدم شريط التمرير للتسجيل\n3. تأكد من أنك في مكان العمل المحدد\n\nتقديم طلب إجازة:\n1. انتقل إلى قسم الإجازات\n2. حدد نوع الإجازة والتواريخ\n3. أضف السبب وارسل\n\nعرض المستندات:\n1. انتقل إلى قسم المستندات\n2. عرض المستندات التي قمت بتحميلها\n3. تنزيل أو مشاركة حسب الحاجة\n\nنصائح:\n-_keep خدمات الموقع مفعلة\n- مزامنة الحضور بانتظام\n- تحقق من الإشعارات للتحديثات"
    }
  },
  sla: {
    title: {
      en: "Service Level Agreement",
      ar: "اتفاقية مستوى الخدمة"
    },
    content: {
      en: "Service Level Agreement (SLA)\n\nLast Updated: March 2026\n\n1. Service Availability\nWe guarantee 99.5% uptime for our services, excluding scheduled maintenance windows.\n\n2. Response Times\n- Critical Issues: 4 hours\n- Major Issues: 8 hours\n- Minor Issues: 24 hours\n\n3. Support Hours\nOur support team is available:\n- Monday to Friday: 9 AM - 6 PM (GST)\n- Emergency support: 24/7 for critical issues\n\n4. Maintenance Windows\nScheduled maintenance will be communicated at least 24 hours in advance.\n\n5. Data Backup\nDaily backups are performed with 30-day retention. Data can be recovered within 4 business hours.\n\n6. Contact Support\nEmail: support@alphax.com\nPhone: +971 4 123 4567",
      ar: "اتفاقية مستوى الخدمة (SLA)\n\nآخر تحديث: مارس 2026\n\n1. توفر الخدمة\nنضمن نسبة توفر 99.5٪ لخدماتنا، باستثناء نوافذ الصيانة المجدولة.\n\n2. أوقات الاستجابة:\n- المشكلات الحرجة: 4 ساعات\n- المشكلات الرئيسية: 8 ساعات\n- المشكلات الثانوية: 24 ساعة\n\n3. ساعات الدعم\nفريق الدعم متاح إلى الجمعة: 9 صباح:\n- الاثنينًا - 6 مساءً (GST)\n- الدعم الطارئ: 24/7 للمشاكل الحرجة\n\n4. نوافذ الصيانة\nسيتم التواصل بشأن الصيانة المجدولة قبل 24 ساعة على الأقل.\n\n5. النسخ الاحتياطي\nيتم إجراء نسخ احتياطية يوميًا مع الاحتفاظ بها لمدة 30 يومًا. يمكن استرداد البيانات خلال 4 ساعات عمل.\n\n6. تواصل مع الدعم\nالبريد الإلكتروني: support@alphax.com\nالهاتف: +971 4 123 4567"
    }
  }
};

const SettingsPage = () => {
  const { language, t } = useLanguage();
  const { theme, themeColors } = useTheme();
  const [showContent, setShowContent] = useState<string | null>(null);

  const isRTL = language === "ar";

  return (
    <div className="pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column - Settings Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-xl font-bold" style={{ color: themeColors.text }}>
              {isRTL ? "الإعدادات" : "Settings"}
            </h1>
          </div>

          {/* Clay Card - Theme + Contact + Learn More */}
          <div className="rounded-[22px] p-5" style={{
            background: "#EEF1F6",
            boxShadow: "9px 9px 18px rgba(10,30,60,0.35), -6px -6px 14px rgba(255,255,255,0.5)",
          }}>
            {/* Theme Section */}
            <div className="pb-5 border-t border-[#E1E4EA]">
              <div className="pt-5">
                <ThemeSelector />
              </div>
            </div>

            {/* Contact Us Section */}
            <div className="py-5 border-t border-[#E1E4EA]">
              <h2 className="text-[13px] font-medium mb-4" style={{ color: themeColors.text }}>
                {isRTL ? "اتصل بنا" : "Contact Us"}
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: "#E1E4EA" }}>
                    <span className="text-sm">📧</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: themeColors.text }}>Email</p>
                    <p className="text-sm" style={{ color: themeColors.textSecondary }}>support@alphax.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: "#E1E4EA" }}>
                    <span className="text-sm">📞</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: themeColors.text }}>Phone</p>
                    <p className="text-sm" style={{ color: themeColors.textSecondary }}>+971 4 123 4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: "#E1E4EA" }}>
                    <span className="text-sm">🌐</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: themeColors.text }}>Website</p>
                    <p className="text-sm" style={{ color: themeColors.textSecondary }}>www.alphax.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: "#E1E4EA" }}>
                    <span className="text-sm">📍</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: themeColors.text }}>Address</p>
                    <p className="text-sm" style={{ color: themeColors.textSecondary }}>
                      {isRTL ? "دبي، الإمارات العربية المتحدة" : "Dubai, UAE"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Learn More Section */}
            <div className="pt-5">
              <h2 className="text-[13px] font-medium mb-3" style={{ color: themeColors.text }}>
                {isRTL ? "اعرف المزيد" : "Learn More"}
              </h2>
              <div className="space-y-2">
                {Object.entries(learnMoreContent).map(([key, item]) => (
                  <div key={key}>
                    <button
                      onClick={() => setShowContent(showContent === key ? null : key)}
                      className="w-full flex items-center justify-between p-3 rounded-[12px] transition-colors"
                      style={{
                        color: themeColors.text,
                        background: showContent === key ? "#E1E4EA" : "transparent",
                      }}
                    >
                      <span className="text-sm font-medium">{item.title[language as keyof typeof item.title]}</span>
                      <span className={`text-xs transition-transform ${showContent === key ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>

                    {/* Expandable Content */}
                    {showContent === key && (
                      <div
                        className="mt-2 p-4 rounded-[12px]"
                        style={{
                          color: themeColors.textSecondary,
                          background: "#E1E4EA",
                        }}
                      >
                        <pre className="whitespace-pre-wrap text-sm font-normal">
                          {item.content[language as keyof typeof item.content]}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Version Footer */}
          <div className="lg:hidden text-center py-4">
            <p style={{ color: themeColors.textSecondary }} className="text-sm">
              {isRTL ? "الإصدار" : "Version"} 1.0.0
            </p>
            <p style={{ color: themeColors.textSecondary }} className="text-xs mt-1">
              © 2026 Alphax. {isRTL ? "جميع الحقوق محفوظة" : "All rights reserved."}
            </p>
          </div>
        </div>

        {/* Right Column - Glass Panel (desktop only) */}
        <div className="hidden lg:block">
          <div className="sticky top-20 rounded-[20px] p-5" style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.25)",
          }}>
            <div className="text-center">
              <h3 className="text-sm font-medium mb-3" style={{ color: themeColors.text }}>
                {isRTL ? "معلومات التطبيق" : "App Info"}
              </h3>
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: themeColors.primary }}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 002 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p style={{ color: themeColors.textSecondary }} className="text-xs">
                {isRTL ? "الإصدار" : "Version"} 1.0.0
              </p>
              <p style={{ color: themeColors.textSecondary }} className="text-[10px] mt-1">
                © 2026 Alphax
              </p>
              <p style={{ color: themeColors.textSecondary }} className="text-[10px]">
                {isRTL ? "جميع الحقوق محفوظة" : "All rights reserved."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
