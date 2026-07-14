
-1st point: 
   - the email shouldnt appear on a typebox like that i want it appear normal in grey with a gear icon beside that shows when clicked a popup with a field to insert new email and send otp to old mail button  "could request an otp once a 30s" with a field to insert it, after confirmation the email accepted but not replaced in database yet until the yser verified it by tappin verify email button that shows beside it, and insert new otp that sents to the new email this time, after confirmation the mail edited in database and shows as confirmed as a new email for the user. 
2nd:
   - i want a button beside update pw if the user forgot the old one the button "forgot password" when clicked the user gets a pop-up that shows a request otp button named "confirm by email" when clicked "could ask otp only once in 45s": the user got an otp and verifies it, if correct a field to answer new password twice appeared and password changed succesfully, if wrong "try again message with quick up from popup.
3rd:
   - for 2fa:
      *remove mobile option and add email instead*
      *keep app methode* 
      we need to set them, when the user switched the toggle to one, it opens a popup that helps setting up 2fa that he choosed, when he exists the popup without configuring the 2fa process untill it is really working, the toggle gets back off.
4th:
   - i want no ghost sessions on devices u logged in, just real ones, lets create the script that handled this process

and ofc i need to edit database if needed first, just gimme sql code to run .






المرحلة 1: تجهيز قاعدة البيانات (OTP & 2FA)
لإدارة رموز التحقق (OTPs) ذات الـ 6 أرقام الخاصة بتغيير البريد الإلكتروني ونسيان كلمة المرور، نحتاج إلى جدول مؤقت ومرن في Supabase.

الجدول المطلوب (verification_codes): سيحتوي على (المعرف، البريد الإلكتروني، رمز الـ OTP، نوع العملية، وتاريخ الانتهاء).

تحديث جدول المستخدمين: إضافة أعمدة الـ 2FA (التي أضفناها في الخطوة السابقة).

المرحلة 2: مسار التفاصيل الشخصية (/api/settings/personal)
سنقوم بإنشاء API يتعامل مع الطلبات التالية:

POST /update-profile: لتحديث الاسم الكامل ورقم الهاتف مباشرة في قاعدة البيانات.

POST /request-email-change: يقوم بإنشاء OTP عشوائي (6 أرقام)، يحفظه في قاعدة البيانات، ويرسله إلى البريد القديم (الحالي).

POST /verify-old-email: يتحقق من الـ OTP، وإذا كان صحيحاً، يقوم بإنشاء OTP جديد ويرسله إلى البريد الجديد (المعلق).

POST /verify-new-email: يتحقق من الـ OTP الثاني، ويقوم بتحديث البريد الإلكتروني بشكل نهائي في جدول user.

المرحلة 3: مسار الأمان وكلمات المرور (/api/settings/security)
سندمج دوال better-auth المدمجة مع منطق الـ OTP الخاص بك:

POST /change-password: للتحقق من كلمة المرور القديمة وتشفير/حفظ الجديدة.

POST /forgot-password/request: لإنشاء OTP وإرساله للبريد للتحقق من هوية المستخدم.

POST /forgot-password/verify: للتحقق من صحة الرمز.

POST /forgot-password/reset: لتحديث كلمة المرور مباشرة بعد التحقق الناجح.

المرحلة 4: المصادقة الثنائية (2FA)
يعتمد better-auth على إضافة (Plugin) مخصصة للـ 2FA:

App 2FA (TOTP): سنقوم بتفعيل إضافة twoFactor في إعدادات better-auth لتوليد الـ (Secret) ورابط الـ QR Code، ومطابقة الرمز المُدخل.

Email 2FA: سنقوم ببرمجة منطق بسيط يرسل OTP عند تسجيل الدخول إذا كانت هذه الخاصية مفعلة في إعدادات المستخدم.









 <aside className="w-64 bg-[#1a1a24] border-r border-white/5 hidden md:flex flex-col z-10 shrink-0">
                <div className="h-16 flex items-center px-6 border-b border-white/5">
                    <span className="text-lg font-bold tracking-wider">
                        Prop<span className="text-[#02AFA9]">OS</span>
                    </span>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-md text-sm font-medium transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        Dashboard
                    </Link>
                    <button onClick={() => setActiveTab('personal')} className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#02AFA9]/10 text-[#02AFA9] rounded-md text-sm font-medium transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Settings
                    </button>
                    <Link href="#" className="flex items-center gap-3 px-3 py-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-md text-sm font-medium transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        Contact Developer
                    </Link>
                </nav>
                <div className="p-4 border-t border-white/5">
                    <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-3 py-2 text-white/50 hover:text-[#FF5E5F] hover:bg-[#FF5E5F]/10 rounded-md text-sm font-medium transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Logout
                    </button>
                </div>
            </aside>