<?php

namespace App\Http\Controllers;

require base_path("vendor_twilio/autoload.php");

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail; // For email

use Twilio\Rest\Client; // For SMS, if using Twilio or any other SMS service
use App\Models\User; // Assuming you're using a User model
use Illuminate\Support\Facades\Validator;
use App\Services\OtpService;
use Illuminate\Support\Facades\DB;

use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    protected $otpService;

    public function __construct(OtpService $otpService)
    {
        $this->otpService = $otpService;
    }

    public function sendOtp(Request $request)
    {
        // Validate request data
        $validator = Validator::make($request->all(), [
            'method' => 'required|in:email,sms',
            'email' => 'sometimes|email',
            'phone' => 'sometimes|string',
            'name' => 'required|string',
            'username' => 'required|string',
            'country_code' => 'sometimes|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $method = $request->input('method');
        

             $name = $request->input('name');
            $username = $request->input('username');

            
        if ($method === 'email') {
            // Send OTP to Email using OtpService
            $email = $request->input('email');
       

            if ($this->otpService->sendOTPemail($email, $name, $username)) {
                return response()->json(['success' => "OTP Successfully Sent to your Email", 'redirect' => route('showVerifyPage',['username'=>$username]) ], 200);
            } else {
                return response()->json(['error' => "Email sending failed."], 500);
            }

        } elseif ($method === 'sms') {
            // Generate and send OTP via SMS (using Twilio or similar service)
            $otp = rand(100000, 999999); // Generate a random OTP

            // Store OTP in session for later verification
            session(['otp' => $otp]);

            // Use updateOrInsert to store the OTP and the current Unix timestamp
        DB::table('otp')->updateOrInsert(
            ['username' => $username],
            ['otp' => $otp, 'timestamp' => time()] // Using time() for Unix timestamp
        );

            try {


                $twilio = new Client(config('services.twilio.sid'), config('services.twilio.token'));
                $twilio->messages->create($request->input('country_code').$request->input('phone'), [
                'from' => config('services.twilio.from'), // Use Twilio 'from' number from config
                'body' => "Dear {$name},\n\nThank you for using our services. Your OTP verification code is: {$otp}\n\nIf you did not request this, please ignore this message.\n\nThis OTP code is valid for the next 10 minutes."
            ]);
                return response()->json(['success' => "OTP Successfully Sent to your Phone Number", 'redirect' => route('showVerifyPage',['username'=>$username])], 200);
            } catch (\Exception $e) {
                return response()->json(['error' => "SMS sending failed: " . $e->getMessage()], 500);
            }
        }

        return response()->json(['error' => "Please select a method."], 404);
    }

    // Method to show the verification page
    public function showVerifyPage(Request $request)
    {
        
        $username=$request->query('username');

        return view('auth.verify',compact('username')); // Create a view file for verification
    }

public function verifyOtp(Request $request)
{
    $request->validate([
        'otp' => 'required|integer',
        'username' => 'required',
    ]);

    // Check if the OTP and username match in the otp table
    $otpRecord = DB::table('otp')->where('username', $request->input('username'))
                    ->where('otp', $request->input('otp'))
                    ->first();

    if ($otpRecord) {
        // OTP is valid, find the user associated with this username
        $user = User::where('username', $request->input('username'))->first();

        if ($user) {
            // Authenticate the user
            Auth::login($user);

            // Clear OTP from session and delete the OTP record from the database
            session()->forget('otp');
            DB::table('otp')->where('username', $request->input('username'))
                ->where('otp', $request->input('otp'))
                ->delete(); // Delete OTP record after successful verification

            return response()->json(['success' => "OTP Verified Successfully", 'redirect' => route('dashboard')], 200);
        } else {
            return response()->json(['error' => "User not found"], 404);
        }
    } else {
        return response()->json(['error' => "Invalid OTP"], 400);
    }
}




}
