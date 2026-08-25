<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Exception;

class CustomLoginController extends Controller
{




public function store(Request $request)
{

// dd($request->userAgent());

    // Validate login and password fields
    $request->validate([
        'email' => 'required|string',  // login field can be email, username, or phone
        'password' => 'required|string',
    ]);

    $loginInput = $request->input('email');
    $password = $request->input('password');

    // Determine if login input is email, username, or phone
    $fieldType = filter_var($loginInput, FILTER_VALIDATE_EMAIL) ? 'email' : 
                 (is_numeric($loginInput) ? 'phone' : 'username');

    // Attempt to find the user by the identified field (email, username, or phone)
    $get_user = DB::table('users')->where($fieldType, $loginInput)->first();

    // If the user is not found, throw a validation exception
    if (!$get_user) {
        throw ValidationException::withMessages([
            'email' => __('auth.user_not_found'),
        ]);
    }

    // Retrieve the stored hashed password
    $hash_pass = $get_user->password;

    // Check if OTP authentication is enabled for the user
    if ($get_user->otp_auth_enabled == 1) {
        // Verify the provided password
        if (password_verify($password, $hash_pass)) {
            // Password is correct and OTP is required
            return response()->json([
                'message' => 'OTP',
                'user' => $get_user,
            ]);
        } else {
            // Password verification failed
            throw ValidationException::withMessages([
                'password' => __('auth.password'),
            ]);
        }
    }

    // OTP authentication is not enabled, proceed with normal authentication
    if (Auth::attempt([$fieldType => $loginInput, 'password' => $password], $request->filled('remember'))) {
        // Regenerate session to prevent session fixation attacks
        $request->session()->regenerate();


        $user = Auth::user();

        // Get the user's first system identifier
        $currentDeviceId = hash('sha256', $request->ip() . $request->userAgent());

// if($user->is_admin!=1 && $user->is_superadmin!=1){
//         if (!$user->first_device_id) {
//             // Store the first system identifier for the user
//             $user->update(['first_device_id' => $currentDeviceId]);
//         } elseif ($user->first_device_id !== $currentDeviceId) {
//             // Block login if the identifier doesn't match the first device
//             Auth::logout();
//             return response()->json(['message' => 'You can only log in from your first registered system.']);

//         }
//     }


        // Successful login response
        return response()->json([
            'message' => 'Login successful',
            'user' => Auth::user(),
            'redirect' => route('dashboard') // Route to the dashboard or another target page
        ]);
    }

    // If authentication fails
    throw ValidationException::withMessages([
        'email' => __('auth.failed'),
    ]);
}














}
