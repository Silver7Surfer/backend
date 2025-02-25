export const generateVerificationEmail = (token) => `
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
            .security-tips {
                background: #fff3e0;
                border: 1px solid #ffe0b2;
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
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo-container">
                    <div class="logo">GAMEPAY</div>
                </div>
                <h1>🔐 Email Verification Required</h1>
            </div>
            
            <div class="content">
                <div style="font-size: 18px; color: #1a237e; margin-bottom: 20px;">
                    Welcome to GamePay! 🎮
                </div>
                
                <p>Thank you for choosing GamePay as your gaming platform. To ensure the security of your account and access all our features, please verify your email address.</p>
                
                <a href="https://daibackend-1.onrender.com/api/auth/verify-email/${token}" class="button">
                    VERIFY EMAIL ADDRESS
                </a>

                <div class="security-info">
                    <h3>🔒 Security Information</h3>
                    <ul>
                        <li>This verification link is unique to your account</li>
                        <li>The link will expire in 24 hours</li>
                        <li>Verification helps protect your account from unauthorized access</li>
                        <li>We use industry-standard encryption to protect your data</li>
                    </ul>
                </div>

                <div class="security-tips">
                    <h3>🛡️ Security Tips</h3>
                    <ul>
                        <li>Never share your login credentials</li>
                        <li>Use a strong, unique password</li>
                        <li>Enable two-factor authentication after verification</li>
                        <li>Always ensure you're on our official website</li>
                    </ul>
                </div>

                <div class="warning">
                    ⚠️ Important: If you didn't create a GamePay account, please ignore this email and contact our security team immediately.
                </div>

                <div class="contact-info">
                    <h3>📞 Need Help?</h3>
                    <p>Our support team is available 24/7:</p>
                    <p>Email: support@gamepay.com</p>
                    <p>Support Portal: help.gamepay.com</p>
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
                <p>This is an automated message. Please do not reply to this email.</p>
                <p style="font-size: 11px; color: #999;">
                    You're receiving this email because you recently created an account on GamePay.
                    If this wasn't you, please ignore this email.
                </p>
            </div>
        </div>
    </body>
    </html>
`;