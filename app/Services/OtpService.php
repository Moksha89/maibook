<?php

namespace App\Services;

require 'vendor_phpmailer/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;
use Illuminate\Support\Facades\DB;

class OtpService
{
    public function sendOTPemail($emailAddress, $nameOfUser, $username)
    {
        // Generate OTP code (6 digits)
        $otp = strval(rand(100000, 999999));

        try {
            // Insert or update the OTP in the database
            // Use updateOrInsert to store the OTP and the current Unix timestamp
        DB::table('otp')->updateOrInsert(
            ['username' => $username],
            ['otp' => $otp, 'timestamp' => time()] // Using time() for Unix timestamp
        );

            // Create a new PHPMailer instance
            $mail = new PHPMailer(true);
            // Configure SMTP settings for PHPMailer
            $mail->isSMTP();
            $mail->Host = 'mail.maibook.in';
            $mail->SMTPAuth = true;
            $mail->Username = 'support@maibook.in';
            $mail->Password = 'o)J1JwLCe!En';
            $mail->Port = 587;

            // Set email details
            $mail->setFrom('support@maibook.in', 'OTP Verification');
            $mail->addAddress($emailAddress, $nameOfUser);
            $mail->isHTML(true); // Set email format to HTML
            $mail->Subject = 'VL Group :: OTP Verification';
            $mail->Body = '<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>OTP Verification Email</title>
                </head>
                <body>
                    <div class="email-container">
                        <div class="header">
                            <h1>OTP Verification Code</h1>
                        </div>
                        <div class="content">
                            <p>Dear ' . htmlspecialchars($nameOfUser) . ',</p>
                            <p>Thank you for using our services. Please find your OTP code below to complete the verification process:</p>
                            <div class="otp-code"><h3>' . $otp . '</h3></div>
                            <p>If you did not request this, please ignore this email.</p>
                        </div>
                        <div class="footer">
                            <p>This OTP code is valid for the next 10 minutes. If you need assistance or have any questions, please contact our support team.</p>
                        </div>
                    </div>
                </body>
                </html>';

            // Send email
            if ($mail->send()) {
                return true; // Return true if email sent successfully
            } else {
                return false; // Return false if email sending failed
            }
        } catch (PHPMailerException $e) {
            return false; // Handle PHPMailer exceptions
        } catch (\Exception $e) {
            return false; // Handle any other exceptions
        }
    }
}
