<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Auth;
use Illuminate\Support\Facades\Http;
use App\Mail\BackupCreated; 
use Illuminate\Support\Facades\Mail;
use App\Services\OtpService;
use Carbon\Carbon;

class BackupController extends Controller
{

        protected $otpService;

    public function __construct(OtpService $otpService)
    {
        $this->otpService = $otpService;
    }


    public function createBackup(Request $request)
    {
        // Validate the user_id
        $user_id = filter_var(trim($request->query('user_id')), FILTER_SANITIZE_FULL_SPECIAL_CHARS);

        try {
            // Get the BACKUP_PATH from the environment variable
            $backupPath = storage_path('app/backups/'); // Use Laravel's storage path

            // Ensure the backup directory exists
            if (!is_dir($backupPath)) {
                mkdir($backupPath, 0755, true); // Create directory if it doesn't exist
            }

            // Fetch data from tables
            $data = [
                'transactions' => DB::table('transactions')->get(),
                'partners' => DB::table('partners')->get(),
                'companies' => DB::table('companies')->get(),
                'company_assignments' => DB::table('company_assignments')->get()
            ];

            // Convert data to JSON format for backup
            $jsonData = json_encode($data);

            // Encrypt the data
            $encryptedData = $this->encryptData($jsonData); // Note the use of $this

            // Create a filename using the current timestamp
            $timestamp = time();
            $backupFileName = "backup_$timestamp.ibbx";
            $backupFilePath = $backupPath . $backupFileName;

            // Write the encrypted data to a file
            if (file_put_contents($backupFilePath, $encryptedData) === false) {
                throw new \Exception("Failed to write backup file.");
            }

            // Insert the backup entry in the `backups` table
            DB::table('backups')->insert([
                'timestamp' => $timestamp,
                'file_url' => $backupFileName // Store the filename in the DB
            ]);

     // Log the success message using file_put_contents()
        $logMessage = '[' . now() . '] Backup created successfully.' . PHP_EOL;
        file_put_contents(storage_path('app/backups/backup_log.txt'), $logMessage, FILE_APPEND);


// // Send email with backup file to super admin 
//         $superAdminEmail = DB::table('logo')->where('is_superadmin', 1)->value('email'); 

//         Mail::to($superAdminEmail)->send(new BackupCreated($backupFilePath));


        // Fetch all emails from the backup_emails table
$backupEmails = DB::table('backup_emails')->pluck('email');

// Send the email to each email address from the backup_emails table
foreach ($backupEmails as $email) {
    Mail::to($email)->send(new BackupCreated($backupFilePath));
}



            // Respond with success message
          return response()->json([
    'success' => 'Backup created and saved successfully.',
    'backup_file' => url("storage/backups/$backupFileName"), // Use url() to create a full URL
], 200);


        } catch (\Exception $e) {

              // Log the success message using file_put_contents()
        $logMessage = '[' . now() . '] Backup not created successfully.' . PHP_EOL;
        file_put_contents(storage_path('app/backups/backup_log.txt'), $logMessage, FILE_APPEND);
          
            return response()->json([
                'error' => 'Backup failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function encryptData($data)
    {
        try {
            // Use Laravel's Crypt facade to encrypt data
            return Crypt::encryptString($data);
        } catch (\Exception $e) {
            throw new \Exception('Encryption failed: ' . $e->getMessage());
        }
    }


public function restoreBackup(Request $request)
{

// Extract the user_id from the request 
$user_id = Auth::user()->id; 
// Make a GET request to createBackup with the user_id 
$response = Http::get(url('/backup'), ['user_id' => $user_id]); 




    $backupId = $request->query('backup_id');

    if (empty($backupId)) {
        return response()->json(['error' => 'Please choose a backup.'], 400);
    }

    try {
        $backup = DB::table('backups')->where('id', $backupId)->first(['timestamp', 'file_url']);

        if (!$backup) {
            return response()->json(['error' => 'Backup not found.'], 404);
        }

        $backupFilePath = storage_path("app/backups/backup_{$backup->timestamp}.ibbx");

        if (!file_exists($backupFilePath)) {
            throw new Exception('Backup file not found on the server.');
        }

        $encryptedData = file_get_contents($backupFilePath);
        $decryptedData = $this->decryptData($encryptedData);

        if (!$decryptedData) {
            throw new Exception('Failed to decrypt backup data.');
        }

        $data = json_decode($decryptedData, true);
        if (!$data) {
            throw new Exception('Failed to parse decrypted data.');
        }

        // Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Truncate tables
        DB::table('transactions')->truncate();
        DB::table('partners')->truncate();
        DB::table('companies')->truncate();
        DB::table('company_assignments')->truncate();

        // Restore data for each table
        if (!empty($data['transactions'])) {
            foreach ($data['transactions'] as $transaction) {
                DB::table('transactions')->insert($transaction);
            }
        }

        if (!empty($data['partners'])) {
            foreach ($data['partners'] as $partner) {
                DB::table('partners')->insert($partner);
            }
        }

        if (!empty($data['companies'])) {
            foreach ($data['companies'] as $company) {
                DB::table('companies')->insert($company);
            }
        }

        if (!empty($data['company_assignments'])) {
            foreach ($data['company_assignments'] as $assignment) {
                DB::table('company_assignments')->insert($assignment);
            }
        }

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        return response()->json(['success' => 'Backup restored successfully.'], 200);

    } catch (Exception $e) {
        return response()->json(['error' => 'Restore failed: ' . $e->getMessage()], 500);
    }
}


// Encrypt or decrypt data using Laravel's Crypt facade
private function decryptData($data)
{
    try {
        return Crypt::decryptString($data);
    } catch (Exception $e) {
        throw new Exception('Decryption failed: ' . $e->getMessage());
    }
}



public function download($id)
{
    $backup = DB::table('backups')->where('id', $id)->first();

    if (!$backup || !file_exists(storage_path("app/backups/backup_{$backup->timestamp}.ibbx"))) {
        return response()->json(['error' => 'Backup file not found.'], 404);
    }

    $filePath = storage_path("app/backups/backup_{$backup->timestamp}.ibbx");

    return response()->download($filePath, "backup_{$backup->timestamp}.ibbx");
}


// public function uploadBackup(Request $request)
// {
//     // Check if a file is uploaded
//     if (!$request->hasFile('backup_file')) {
//         return back()->with('error', 'Please upload a backup file.');
//     }

//     // Check the file extension
//     $file = $request->file('backup_file');
//     $extension = $file->getClientOriginalExtension();

//     if ($extension !== 'ibbx') {
//         return back()->with('error', 'Invalid file type. Only .ibbx files are allowed.');
//     }


    
//     try {
//         // Store the file in the 'backups' directory inside storage/app
//         $path = $request->file('backup_file')->storeAs('backups', $request->file('backup_file')->getClientOriginalName());

//         // Insert the backup entry in the `backups` table with the timestamp and file path
//         DB::table('backups')->insert([
//             'timestamp' => time(),
//             'file_url' => $path
//         ]);

//         return back()->with('success', 'Backup uploaded successfully. File path: ' . $path);

//     } catch (\Exception $e) {
//         return back()->with('error', 'Failed to upload backup: ' . $e->getMessage());
//     }
// }


public function uploadBackup(Request $request)
{
    // Check if a file is uploaded
    if (!$request->hasFile('backup_file')) {
        return back()->with('error', 'Please upload a backup file.');
    }

    // Check the file extension
    $file = $request->file('backup_file');
    $extension = $file->getClientOriginalExtension();

    if ($extension !== 'ibbx') {
        return back()->with('error', 'Invalid file type. Only .ibbx files are allowed.');
    }

    try {
        // Ensure the 'backups' directory exists
        $backupPath = storage_path('app/backups/');
        if (!is_dir($backupPath)) {
            mkdir($backupPath, 0755, true);
        }

        // Store the file in the 'backups' directory inside storage/app
        $filename = $file->getClientOriginalName();
        $path = $file->storeAs('backups', $filename);

        // Insert the backup entry in the `backups` table with the timestamp and file path
        DB::table('backups')->insert([
            'timestamp' => time(), // Use Carbon for the current timestamp
            'file_url' => $filename
        ]);

        return back()->with('success', 'Backup uploaded successfully. File path: ' . $path);

    } catch (\Exception $e) {
        return back()->with('error', 'Failed to upload backup: ' . $e->getMessage());
    }
}



public function sendOtp(Request $request)
    {
        // Validate request data
        $validator = Validator::make($request->all(), [
            'method' => 'required|in:email,sms',
            
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $method = $request->input('method');
        

             $name = Auth::user()->name;
            $username = Auth::user()->username;

            
        if ($method === 'email') {
            // Send OTP to Email using OtpService
            $email = Auth::user()->email;
       

            if ($this->otpService->sendOTPemail($email, $name, $username)) {
                return response()->json(['success' => "OTP Successfully Sent to your Email"], 200);
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
                $twilio->messages->create(Auth::user()->country_code.Auth::user()->phone, [
                'from' => config('services.twilio.from'), // Use Twilio 'from' number from config
                'body' => "Dear {$name},\n\nThank you for using our services. Your OTP verification code is: {$otp}\n\nIf you did not request this, please ignore this message.\n\nThis OTP code is valid for the next 10 minutes."
            ]);
                return response()->json(['success' => "OTP Successfully Sent to your Phone Number"], 200);
            } catch (\Exception $e) {
                return response()->json(['error' => "SMS sending failed: " . $e->getMessage()], 500);
            }
        }

        return response()->json(['error' => "Please select a method."], 404);
    }



public function verifyOtp2(Request $request)
{
    $request->validate([
        'otp' => 'required|integer',
        
    ]);

    // Check if the OTP and username match in the otp table
    $otpRecord = DB::table('otp')->where('username', Auth::user()->username)
                    ->where('otp', $request->input('otp'))
                    ->first();

    if ($otpRecord) {
        
     

            // Clear OTP from session and delete the OTP record from the database
            session()->forget('otp');
            DB::table('otp')->where('username', Auth::user()->username)
                ->where('otp', $request->input('otp'))
                ->delete(); // Delete OTP record after successful verification

            return response()->json(['success' => "OTP Verified Successfully"], 200);
       
    } else {
        return response()->json(['error' => "Invalid OTP"], 400);
    }
}




public function cleanupBackups(Request $request)
{
    // Calculate the timestamp for 10 days ago
    $tenDaysAgo = Carbon::now()->subDays(10)->timestamp;

    // Delete rows where the timestamp is more than 10 days old
    $deleted = DB::table('backups')->where('timestamp', '<', $tenDaysAgo)->delete();

    if ($deleted) {
        return response()->json(['success' => 'Old backups deleted successfully.']);
    } else {
        return response()->json(['error' => 'No old backups found to delete.']);
    }
}



}
