<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\PartnerController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\Auth\CustomLoginController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\BackupEmailController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\WhatsappController;
use Illuminate\Support\Facades\Mail; 
use Illuminate\Support\Facades\Auth;



use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;







Route::get('/send-simple-email', function () { $toEmail = 'fagunigupta111@gmail.com'; 
// Replace with your email 
    Mail::raw('This is a test email sent from Laravel.', function ($message) use ($toEmail) { 
        $message->to($toEmail) ->subject('Test Email from Laravel'); 
    }); 
    return 'Test email has been sent.'; 
});




Route::post('/send-otp', [AuthController::class, 'sendOtp'])->name('sendOtp');
Route::get('/verify-otp', [AuthController::class, 'showVerifyPage'])->name('showVerifyPage'); // Display verification page
Route::post('/verify-otp', [AuthController::class, 'verifyOtp'])->name('verifyOtp'); // Verify OTP




Route::post('/customlogin', [CustomLoginController::class, 'store'])->name('customlogin');




/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('auth.login');
});

Route::get('/backup', [BackupController::class, 'createBackup'])->name('backup');


Route::get('/dashboard', function () {
    if (Auth::user()->is_superadmin) {
        return redirect()->route('admin.dashboard');
    }

    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');






Route::middleware('auth')->group(function () {



Route::resource('backup-emails', BackupEmailController::class);




    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

Route::get('/companies/data', [CompanyController::class, 'getCompanyData'])->name('companies.data');
Route::get('/companies/inactivedata', [CompanyController::class, 'getInactiveCompanyData'])->name('companies.inactivedata');


Route::post('/create-company', [CompanyController::class, 'createCompany'])->name('create-company');

Route::post('/companies/edit/', [CompanyController::class, 'editCompany'])->name('edit-company');
Route::patch('/companies/inactive/{id}', [CompanyController::class, 'makeInactive'])->name('make-inactive');
Route::patch('/companies/active/{id}', [CompanyController::class, 'makeactive'])->name('make-active');
Route::get('/company-info', [CompanyController::class, 'getCompanyInfo'])->name('company-info');

Route::get('/company-info-inactive', [CompanyController::class, 'getCompanyInfobyuser'])->name('company-info-inactive');

Route::get('/company-info-ajax', [CompanyController::class, 'getCompanyInfoajax'])->name('company-info-ajax');

Route::post('/transactions', [CompanyController::class, 'getTransactions'])->name('transactions.get');
Route::post('/transactions/store', [TransactionController::class, 'store'])->name('transactions.store');
Route::post('/transactions/delete', [TransactionController::class, 'delete'])->name('transactions.delete');
Route::post('/transactions/restore', [TransactionController::class, 'restore'])->name('transactions.restore');

Route::post('/transactions/delete_parmanent', [TransactionController::class, 'delete_parmanent'])->name('transactions.delete_parmanent');


Route::get('/generate-transaction-report', [TransactionController::class, 'generateTransactionReport'])->name('generate.transaction.report');

Route::get('/partners', [TransactionController::class, 'get_partners'])->name('partners');
Route::get('/remarks', [TransactionController::class, 'get_remarks'])->name('remarks');

// web.php or api.php (if you're making this an API request)
Route::post('/partners/update', [PartnerController::class, 'updatePartner'])->name('partners.update');
Route::post('/partners/inactive', [PartnerController::class, 'inactivePartner'])->name('partners.inactive');
Route::post('/partners/active', [PartnerController::class, 'activePartner'])->name('partners.active');
Route::post('/partners/add-partner', [PartnerController::class, 'store'])->name('partners.store');
Route::get('/partners/searchPartners', [PartnerController::class, 'searchPartners'])->name('search.partners');

Route::get('/company-partners', [CompanyController::class, 'getCompanyPartners'])->name('reports');

Route::get('/generate-report-pdf', [ReportController::class, 'generateReportPDF'])->name('generateReportPDF');

Route::get('/ActivegenerateReportPDF', [ReportController::class, 'activegenerateReportPDF'])->name('ActivegenerateReportPDF');

Route::get('/append_active_inactive_users/{companyId}', [ReportController::class, 'total_users'])->name('append_active_inactive_users');

Route::get('/setting', [ReportController::class, 'setting'])->name('setting');

Route::post('/update-title', [ReportController::class, 'updateTitle'])->name('update.title');


Route::post('/update-company', [CompanyController::class, 'updateCompany'])->name('updateCompany');


Route::post('/user_create', [UsersController::class, 'store'])->name('user.store');
Route::post('/user_update', [UsersController::class, 'update'])->name('user.update');
Route::post('/update_paas', [UsersController::class, 'update_emp'])->name('user.update_emp');
Route::get('/user/edit/{id}', [UsersController::class, 'edit'])->name('user.edit');
Route::get('/user/resetDevice/{id}', [UsersController::class, 'resetDevice'])->name('user.resetDevice');




Route::post('/full_access', [UsersController::class, 'toggleFullAccess'])->name('full_access');
Route::post('/otp_auth', [UsersController::class, 'toggleOTPAccess'])->name('otp_auth');





Route::get('/backup/restore', [BackupController::class, 'restoreBackup'])->name('restore');

Route::get('/backup/download/{id}', [BackupController::class, 'download'])->name('backup.download');

Route::post('/backup/upload', [BackupController::class, 'uploadBackup'])->name('upload.backup');

Route::post('/send-otp2', [BackupController::class, 'sendOtp'])->name('sendOtp2');
Route::post('/verify-otp2', [BackupController::class, 'verifyOtp2'])->name('verifyOtp2');

Route::post('/upload-logo', [SettingsController::class, 'uploadLogo'])->name('upload.logo');

Route::get('/cleanup-backups', [BackupController::class, 'cleanupBackups'])->name('cleanupBackups');



//admin routes

Route::get('all_backup',[AdminController::class,'all_backup'])->name('admin.dashboard');
Route::get('/home', [AdminController::class, 'dashboardHome'])->name('admin.home');

Route::get('/all_companies', [AdminController::class, 'all_companies'])->name('all-companies');


Route::delete('/delete-company/{id}', [AdminController::class, 'delete_company'])->name('delete_company');


Route::get('/company_assignments', [AdminController::class, 'company_assignments'])->name('company_assignments');

Route::get('company_assignments/{id}/edit', [AdminController::class, 'company_assignments_edit'])->name('company_assignments.edit');
Route::post('company_assignments/{id}', [AdminController::class, 'company_assignments_update'])->name('company_assignments.update');
Route::delete('company_assignments/{id}', [AdminController::class, 'company_assignments_destroy'])->name('company_assignments.destroy');




Route::get('/logo', [AdminController::class, 'logo'])->name('logo');



Route::get('/partner', [AdminController::class, 'partner'])->name('partner');
Route::post('/update-partner', [AdminController::class, 'update'])->name('update-partner');
Route::post('/delete-partner', [AdminController::class, 'delete'])->name('delete-partner');


Route::get('admin_transaction',[AdminController::class,'admin_transaction'])->name('admin_transaction');

Route::get('user_company_access',[AdminController::class,'user_company_access'])->name('user_company_access');

Route::get('user_company_access/{id}/edit', [AdminController::class, 'user_company_access_edit'])->name('user_company_access.edit');
Route::post('user_company_access/{id}', [AdminController::class, 'user_company_access_update'])->name('user_company_access.update');
Route::delete('user_company_access/{id}', [AdminController::class, 'user_company_access_destroy'])->name('user_company_access.destroy');


Route::get('/user', [AdminController::class, 'user'])->name('user');
Route::delete('/user/delete/{id}', [AdminController::class, 'destroy'])->name('user.delete');


Route::post('/user/update-transaction', [AdminController::class, 'store'])->name('user.update-transaction');

// In routes/web.php or routes/api.php
Route::get('/get-partners/{companyId}', [AdminController::class, 'getPartnersByCompany'])->name('getPartnersByCompany');




// Real-time data API routes
Route::get('/api/backups', [AdminController::class, 'api_backups'])->name('api.backups');
Route::get('/api/partners', [AdminController::class, 'api_partners'])->name('api.partners');
Route::get('/api/companies', [AdminController::class, 'api_companies'])->name('api.companies');
Route::get('/api/transactions', [AdminController::class, 'api_transactions'])->name('api.transactions');
Route::get('/api/company-assignments', [AdminController::class, 'api_company_assignments'])->name('api.company_assignments');
Route::get('/api/user-company-access', [AdminController::class, 'api_user_company_access'])->name('api.user_company_access');
Route::get('/api/users', [AdminController::class, 'api_users'])->name('api.users');

});

Route::middleware(['auth', 'whatsapp.admin'])->group(function () {
    Route::get('/wa', [WhatsappController::class, 'settings'])->name('whatsapp.settings');
    Route::get('/wa/status', [WhatsappController::class, 'status'])->name('whatsapp.status');
    Route::post('/wa/login', [WhatsappController::class, 'login'])->name('whatsapp.login');
    Route::post('/wa/logout', [WhatsappController::class, 'logout'])->name('whatsapp.logout');
});

Route::middleware('auth')->group(function () {
    Route::post('/wa/send-report', [WhatsappController::class, 'sendReport'])
        ->middleware('throttle:10,1')
        ->name('whatsapp.send-report');
});

require __DIR__.'/auth.php';
