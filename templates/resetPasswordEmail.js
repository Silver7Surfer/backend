export const generateResetPasswordEmail = (token) => `
   <!DOCTYPE html>
   <html>
   <head>
       <style>
           body {
               font-family: 'Arial', sans-serif;
               line-height: 1.6;
               color: #333333;
               margin: 0;
               padding: 0;
           }
           .email-container {
               max-width: 600px;
               margin: 0 auto;
               padding: 20px;
               background: #ffffff;
           }
           .header {
               background: linear-gradient(135deg, #1a237e, #0d47a1);
               padding: 30px 20px;
               text-align: center;
               border-radius: 10px 10px 0 0;
           }
           .logo-container {
               margin-bottom: 20px;
           }
           .logo {
               width: 150px;
               height: 40px;
               background: #ffffff;
               padding: 10px;
               border-radius: 5px;
               margin: 0 auto;
               font-size: 24px;
               font-weight: bold;
               color: #1a237e;
           }
           .header h1 {
               color: #ffffff;
               margin: 10px 0 0;
               font-size: 24px;
               text-transform: uppercase;
               letter-spacing: 1px;
           }
           .content {
               padding: 30px 20px;
               background: #f9f9f9;
               border: 1px solid #eeeeee;
               border-radius: 0 0 10px 10px;
           }
           .button {
               display: inline-block;
               padding: 15px 35px;
               margin: 20px 0;
               background: linear-gradient(135deg, #1a237e, #0d47a1);
               color: #ffffff !important;
               text-decoration: none;
               border-radius: 5px;
               font-weight: bold;
               text-align: center;
               transition: all 0.3s ease;
               box-shadow: 0 2px 5px rgba(0,0,0,0.2);
           }
           .button:hover {
               transform: translateY(-2px);
               box-shadow: 0 4px 8px rgba(0,0,0,0.2);
           }
           .security-info {
               background: #e8f5e9;
               border: 1px solid #c8e6c9;
               border-radius: 5px;
               padding: 15px;
               margin: 20px 0;
           }
           .warning {
               margin-top: 15px;
               padding: 15px;
               color: #856404;
               background-color: #fff3cd;
               border: 1px solid #ffeeba;
               border-radius: 5px;
               font-size: 14px;
           }
           .password-tips {
               background: #e3f2fd;
               border: 1px solid #bbdefb;
               border-radius: 5px;
               padding: 15px;
               margin: 20px 0;
           }
           .brand-bar {
               background: linear-gradient(135deg, #1a237e, #0d47a1);
               height: 5px;
               margin: 20px 0;
           }
           .footer {
               margin-top: 20px;
               text-align: center;
               color: #666666;
               font-size: 12px;
               border-top: 1px solid #eeeeee;
               padding-top: 20px;
           }
           .contact-info {
               margin: 15px 0;
               padding: 15px;
               background: #f5f5f5;
               border-radius: 5px;
           }
           .social-links {
               margin: 15px 0;
           }
           .social-links a {
               color: #1a237e;
               text-decoration: none;
               margin: 0 10px;
           }
           .urgent-notice {
               background: #ffebee;
               border-left: 4px solid #ef5350;
               padding: 15px;
               margin: 20px 0;
           }
       </style>
   </head>
   <body>
       <div class="email-container">
           <div class="header">
               <div class="logo-container">
                   <div class="logo">GAMEPAY</div>
               </div>
               <h1>🔐 Password Reset Request</h1>
           </div>
           
           <div class="content">
               <div style="font-size: 18px; color: #1a237e; margin-bottom: 20px;">
                   Password Reset Instructions
               </div>

               <div class="urgent-notice">
                   ⚠️ Important: This password reset link will expire in 1 hour for security purposes.
               </div>
               
               <p>We received a request to reset the password for your GamePay account. To proceed with the password reset, please click the button below:</p>
               
               <a href="http://192.168.18.3:5173/reset-password/${token}" class="button">
                   RESET PASSWORD
               </a>

               <div class="security-info">
                   <h3>🔒 Security Notice</h3>
                   <ul>
                       <li>This reset link is valid for 1 hour only</li>
                       <li>Link can only be used once</li>
                       <li>If you didn't request this reset, please secure your account</li>
                       <li>Reset links are unique to each request</li>
                   </ul>
               </div>

               <div class="password-tips">
                   <h3>🛡️ Password Requirements</h3>
                   <ul>
                       <li>Minimum 8 characters long</li>
                       <li>Include uppercase and lowercase letters</li>
                       <li>Include at least one number</li>
                       <li>Include at least one special character</li>
                       <li>Don't reuse old passwords</li>
                   </ul>
               </div>

               <div class="warning">
                   If you didn't request a password reset, please contact our security team immediately and secure your account.
               </div>

               <div class="contact-info">
                   <h3>📞 Need Assistance?</h3>
                   <p>Our security team is available 24/7:</p>
                   <p>Email: security@gamepay.com</p>
                   <p>Emergency Support: help.gamepay.com/security</p>
               </div>
           </div>

           <div class="brand-bar"></div>
           
           <div class="footer">
               <p>GamePay - Your Trusted Gaming Payment Platform</p>
               <div class="social-links">
                   <a href="#">Facebook</a> |
                   <a href="#">Twitter</a> |
                   <a href="#">Instagram</a> |
                   <a href="#">Telegram</a>
               </div>
               <p>© ${new Date().getFullYear()} GamePay. All rights reserved.</p>
               <p>This is an automated security email. Please do not reply.</p>
               <p style="font-size: 11px; color: #999;">
                   This email was sent because a password reset was requested for your GamePay account.
                   If this wasn't you, please secure your account immediately.
               </p>
           </div>
       </div>
   </body>
   </html>
`;