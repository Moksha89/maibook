<?php



namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
require base_path('vendor_pdf/autoload.php');
use Mpdf\Mpdf;
use App\Models\Partner;
use App\Models\User;
use App\Models\Company;
use Auth;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
   public function generateReportPDF(Request $request)
{


 $companyId = $request->query('companyID');
 $user_id = $request->query('user_id');

    // Check if companyId is provided
    if (empty($companyId)) {
        return response()->json(['error' => 'Company ID is required.'], 400);
    }

    try {
        // Fetch all active partners for the given company
        $partners = Partner::select('partners.name as partner_name', 'partners.balance as total_balance')
            ->join('company_assignments', 'partners.uuid', '=', 'company_assignments.partner_id')
            ->join('companies', 'company_assignments.company_id', '=', 'companies.company_id')
            ->where('partners.still_active', 1)
            ->where('companies.company_id', $companyId)
            ->orderBy('partners.name', 'asc')
            ->get();

          // Fetch the company name
    $company = Company::where('company_id', $companyId)->first();
    $companyName = $company ? $company->name : ' '; // Default value if company is not found


        // Initialize total balances and arrays for positive and negative balances
        $totalPositiveBalance = 0;
        $totalNegativeBalance = 0;
        $positiveBalances = [];
        $negativeBalances = [];

        // Categorize partners based on their balances
foreach ($partners as $partner) {
    if ($partner->total_balance > 0) {
        // Add to positive balances
        $positiveBalances[] = [
            'partner_name' => $partner->partner_name,
            'total_balance' => $partner->total_balance
        ];
        $totalPositiveBalance += $partner->total_balance;
    } elseif ($partner->total_balance < 0) { // Exclude zero balances from negative
        // Add to negative balances
        $negativeBalances[] = [
            'partner_name' => $partner->partner_name,
            'total_balance' => $partner->total_balance
        ];
        $totalNegativeBalance += $partner->total_balance;
    }
}


        // Add total rows for positive and negative balances
        $positiveBalances[] = [
            'partner_name' => 'Total',
            'total_balance' => $totalPositiveBalance
        ];
        $negativeBalances[] = [
            'partner_name' => 'Total',
            'total_balance' => $totalNegativeBalance
        ];

        // Prepare response data
        $response = [
            'positive_balances' => $positiveBalances,
            'negative_balances' => $negativeBalances
        ];

        // Generate PDF report
        $this->generatePDF($positiveBalances, $negativeBalances,$companyName);

        return response()->json($response, 200);

    } catch (\Exception $e) {
        Log::error('Unable to generate report PDF.', ['exception' => $e]);
        return response()->json(['error' => 'Unable to generate the report.'], 500);
    }
}



public function activegenerateReportPDF(Request $request){
 $companyId = $request->query('companyID');
 $user_id = $request->query('user_id'); 

  // $active_partners = Partner::select('partners.name as partner_name', 'partners.balance as total_balance')
  //           ->join('company_assignments', 'partners.uuid', '=', 'company_assignments.partner_id')
  //           ->join('companies', 'company_assignments.company_id', '=', 'companies.company_id')
  //           ->where('partners.still_active', 1)
  //           ->where('companies.company_id', $companyId)
  //           ->orderBy('partners.name', 'asc')
  //           ->get();


 // $In_active_partners = Partner::select('partners.name as partner_name', 'partners.balance as total_balance')
 //            ->join('company_assignments', 'partners.uuid', '=', 'company_assignments.partner_id')
 //            ->join('companies', 'company_assignments.company_id', '=', 'companies.company_id')
 //            ->where('partners.still_active', 0)
 //            ->where('companies.company_id', $companyId)
 //            ->orderBy('partners.name', 'asc')
 //            ->get();

    $company_name=DB::table('companies')->where('company_id',$companyId)->first('name');


    $positive_balance_partners = Partner::select('partners.name as partner_name', 'partners.balance as total_balance')
        ->join('company_assignments', 'partners.uuid', '=', 'company_assignments.partner_id')
        ->join('companies', 'company_assignments.company_id', '=', 'companies.company_id')
        ->where('partners.still_active', 0)
        ->where('companies.company_id', $companyId)
        ->where('partners.balance', '>', 0)  // Balance > 0 (Positive)
        ->orderBy('partners.name', 'asc')
        ->get();

    // Fetch negative balance partners
    $negative_balance_partners = Partner::select('partners.name as partner_name', 'partners.balance as total_balance')
        ->join('company_assignments', 'partners.uuid', '=', 'company_assignments.partner_id')
        ->join('companies', 'company_assignments.company_id', '=', 'companies.company_id')
        ->where('partners.still_active', 0)
        ->where('companies.company_id', $companyId)
        ->where('partners.balance', '<', 0)  // Balance < 0 (Negative)
        ->orderBy('partners.name', 'asc')
        ->get();

    // Fetch zero balance partners
    $zero_balance_partners = Partner::select('partners.name as partner_name', 'partners.balance as total_balance')
        ->join('company_assignments', 'partners.uuid', '=', 'company_assignments.partner_id')
        ->join('companies', 'company_assignments.company_id', '=', 'companies.company_id')
        ->where('partners.still_active', 0)
        ->where('companies.company_id', $companyId)
        ->where('partners.balance', '=', 0)  // Balance = 0 (Zero)
        ->orderBy('partners.name', 'asc')
        ->get();




  $this->ActivegeneratePDF($company_name,$positive_balance_partners,$zero_balance_partners,$negative_balance_partners);
}


private function ActivegeneratePDF($company_name,$positive_balance_partners,$zero_balance_partners,$negative_balance_partners){



 $mpdf = new \Mpdf\Mpdf();

    // Current date
    $currentDate = date("Y-m-d");

    // Build HTML content for the PDF
   $html = '<p style="text-align:left; font-family:Arial, sans-serif; font-size:20px; color:#4A4A4A; font-weight:bold;">' . htmlspecialchars($company_name->name) . ' Total Users</p>';
    $html .= '<p style="text-align:right; font-family:Arial, sans-serif; font-size:14px; color:#4A4A4A; font-weight:bold;">Date: ' . $currentDate . '</p>';

    // Start table layout for side-by-side tables
    $html .= '<table width="100%" cellspacing="0" cellpadding="10">';
    $html .= '<tr>';

    // Left column: Positive Balances
    $html .= '<td width="33%" valign="top">';
    $html .= '<table border="1" cellpadding="5" cellspacing="0" width="100%" style="border-collapse:collapse; text-align:center; font-family:Arial, sans-serif; font-size:14px;">';
    $html .= '<thead><tr style="background-color:#ffffff; color:#4A4A4A; font-weight:bold;">';
    $html .= '<th>Name</th></tr></thead>';
    $html .= '<th>Balance</th></tr></thead>';
    $html .= '<tbody>';
    foreach ($positive_balance_partners as $balance) {
        // Apply color class based on partner name
        $rowClass = ($balance['partner_name'] === 'Total') ? 'background-color:#6fa3f1;' : 'background-color:#f2d1f8;'; // Light blue and pink
        $html .= '<tr style="' . $rowClass . '">';
        $html .= '<td>' . htmlspecialchars($balance['partner_name']) . '</td>';
        $html .= '<td>' . htmlspecialchars($balance['total_balance']) . '</td>';
        $html .= '</tr>';
    }
    $html .= '</tbody>';
    $html .= '</table>';
    $html .= '</td>';

    // Right column: Negative Balances
    $html .= '<td width="33%" valign="top">';
    $html .= '<table border="1" cellpadding="5" cellspacing="0" width="100%" style="border-collapse:collapse; text-align:center; font-family:Arial, sans-serif; font-size:14px;">';
    $html .= '<thead><tr style="background-color:#ffffff; color:#4A4A4A; font-weight:bold;">';
       $html .= '<th>Name</th></tr></thead>';
    $html .= '<th>Balance</th></tr></thead>';
    $html .= '<tbody>';
    foreach ($negative_balance_partners as $balance) {
        // Apply color class based on partner name
        $rowClass = ($balance['partner_name'] === 'Total') ? 'background-color:#e03e44;' : 'background-color:#ffe0b3;'; // Light red and yellowish
        $html .= '<tr style="' . $rowClass . '">';
        $html .= '<td>' . htmlspecialchars($balance['partner_name']) . '</td>';
        $html .= '<td>' . htmlspecialchars($balance['total_balance']) . '</td>';
        $html .= '</tr>';
    }
    $html .= '</tbody>';
    $html .= '</table>';
    $html .= '</td>';


     // Right column: Negative Balances
    $html .= '<td width="33%" valign="top">';
    $html .= '<table border="1" cellpadding="5" cellspacing="0" width="100%" style="border-collapse:collapse; text-align:center; font-family:Arial, sans-serif; font-size:14px;">';
    $html .= '<thead><tr style="background-color:#ffffff; color:#4A4A4A; font-weight:bold;">';
       $html .= '<th>Name</th></tr></thead>';
    $html .= '<th>Balance</th></tr></thead>';
    $html .= '<tbody>';
    foreach ($zero_balance_partners as $balance) {
        // Apply color class based on partner name
        $rowClass = ($balance['partner_name'] === 'Total') ? 'background-color:#e03e44;' : 'background-color:#ffe0b3;'; // Light red and yellowish
        $html .= '<tr style="' . $rowClass . '">';
        $html .= '<td>' . htmlspecialchars($balance['partner_name']) . '</td>';
        $html .= '<td>' . htmlspecialchars($balance['total_balance']) . '</td>';
        $html .= '</tr>';
    }
    $html .= '</tbody>';
    $html .= '</table>';
    $html .= '</td>';

    $html .= '</tr>';
    $html .= '</table>';

    // Write HTML content to the PDF
    $mpdf->WriteHTML($html);

    // Output PDF to browser
    $mpdf->Output('total_users.pdf', 'D'); // Use 'I' to display in browser
}

private function generatePDF($positiveBalances, $negativeBalances,$companyName)
{

  

    $mpdf = new \Mpdf\Mpdf();

    // Current date
    $currentDate = date("Y-m-d");

    // Build HTML content for the PDF
    $html = '<p style="text-align:left; font-family:Arial, sans-serif; font-size:20px; color:#4A4A4A; font-weight:bold;">' . htmlspecialchars($companyName) . ' Setting Report</p>';
    $html .= '<p style="text-align:right; font-family:Arial, sans-serif; font-size:14px; color:#4A4A4A; font-weight:bold;">Date: ' . $currentDate . '</p>';

    // Start table layout for side-by-side tables
    $html .= '<table width="100%" cellspacing="0" cellpadding="10">';
    $html .= '<tr>';

    // Left column: Positive Balances
    $html .= '<td width="50%" valign="top">';
    $html .= '<table border="1" cellpadding="5" cellspacing="0" width="100%" style="border-collapse:collapse; text-align:center; font-family:Arial, sans-serif; font-size:14px;">';
    $html .= '<thead><tr style="background-color:#ffffff; color:#4A4A4A; font-weight:bold;">';
    $html .= '<th>Partner Name</th><th>Total Balance</th></tr></thead>';
    $html .= '<tbody>';
    foreach ($positiveBalances as $balance) {
        // Apply color class based on partner name
        $rowClass = ($balance['partner_name'] === 'Total') ? 'background-color:#6fa3f1;' : 'background-color:#f2d1f8;'; // Light blue and pink
        $html .= '<tr style="' . $rowClass . '">';
        $html .= '<td>' . htmlspecialchars($balance['partner_name']) . '</td>';
        $html .= '<td>' . htmlspecialchars(round($balance['total_balance'])) . '</td>';
        $html .= '</tr>';
    }
    $html .= '</tbody>';
    $html .= '</table>';
    $html .= '</td>';

    // Right column: Negative Balances
    $html .= '<td width="50%" valign="top">';
    $html .= '<table border="1" cellpadding="5" cellspacing="0" width="100%" style="border-collapse:collapse; text-align:center; font-family:Arial, sans-serif; font-size:14px;">';
    $html .= '<thead><tr style="background-color:#ffffff; color:#4A4A4A; font-weight:bold;">';
    $html .= '<th>Partner Name</th><th>Total Balance</th></tr></thead>';
    $html .= '<tbody>';
    foreach ($negativeBalances as $balance) {
        // Apply color class based on partner name
        $rowClass = ($balance['partner_name'] === 'Total') ? 'background-color:#e03e44;' : 'background-color:#ffe0b3;'; // Light red and yellowish
        $html .= '<tr style="' . $rowClass . '">';
        $html .= '<td>' . htmlspecialchars($balance['partner_name']) . '</td>';
        $html .= '<td>' . htmlspecialchars(round($balance['total_balance'])) . '</td>';
        $html .= '</tr>';
    }
    $html .= '</tbody>';
    $html .= '</table>';
    $html .= '</td>';

    $html .= '</tr>';
    $html .= '</table>';

    // Write HTML content to the PDF
    $mpdf->WriteHTML($html);

    // Output PDF to browser
    $mpdf->Output('partner_balances_report.pdf', 'D'); // Use 'I' to display in browser
}




public function setting()
{
    // Retrieve all users along with their company access
    $users = User::with('companyAccess')->get()->map(function ($user) {
        // Add a new property for the companies and access levels
        $user->companies_access = $user->companyAccess->map(function ($access) {
            return [
                'company_id' => $access->company_id,
                'access_level' => $access->access_level,
            ];
        });

        return $user; // Return the modified user object
    });


    // Check if the authenticated user is an admin
    if (Auth::user()->is_admin) {
        // If the user is an admin, fetch all companies
        $companies = Company::all();
    } else {


        // If the authenticated user is not an admin, fetch only the companies assigned to the authenticated user
        $authUserCompanies = Auth::user()->companyAccess->pluck('company_id');
        $companies = Company::whereIn('id', $authUserCompanies)->get();
    }


// Retrieve backups ordered by created_at timestamp in descending order
$Backup = DB::table('backups')->orderBy('timestamp', 'desc')->get();


$website_title=DB::table('website_title')->first();
   

    // Return the view with the users, companies, and backups
    return view('setting', compact('users', 'companies', 'Backup','website_title'));
}



public function total_users(Request $request, $companyId)
{
    // Get the company ID from the request
    $companyId = $companyId;

    // // Get active partners
    // $active_partners = Partner::select('partners.name as partner_name', 'partners.balance as total_balance')
    //     ->join('company_assignments', 'partners.uuid', '=', 'company_assignments.partner_id')
    //     ->join('companies', 'company_assignments.company_id', '=', 'companies.company_id')
    //     ->where('partners.still_active', 1)
    //     ->where('companies.company_id', $companyId)
    //     ->orderBy('partners.name', 'asc')
    //     ->get();

    // Get inactive partners
    // $in_active_partners = Partner::select('partners.name as partner_name', 'partners.balance as total_balance')
    //     ->join('company_assignments', 'partners.uuid', '=', 'company_assignments.partner_id')
    //     ->join('companies', 'company_assignments.company_id', '=', 'companies.company_id')
    //     ->where('partners.still_active', 0)
    //     ->where('companies.company_id', $companyId)
    //     ->orderBy('partners.name', 'asc')
    //     ->get();

    // Return the data as JSON
    // return response()->json([
    //     'positive' => $active_partners,  // Active users
    //     'negative' => $in_active_partners, // Inactive users
    // ]);

     $positive_balance_partners = Partner::select('partners.name as partner_name', 'partners.balance as total_balance')
        ->join('company_assignments', 'partners.uuid', '=', 'company_assignments.partner_id')
        ->join('companies', 'company_assignments.company_id', '=', 'companies.company_id')
        ->where('partners.still_active', 0)
        ->where('companies.company_id', $companyId)
        ->where('partners.balance', '>', 0)  // Balance > 0 (Positive)
        ->orderBy('partners.name', 'asc')
        ->get();

    // Fetch negative balance partners
    $negative_balance_partners = Partner::select('partners.name as partner_name', 'partners.balance as total_balance')
        ->join('company_assignments', 'partners.uuid', '=', 'company_assignments.partner_id')
        ->join('companies', 'company_assignments.company_id', '=', 'companies.company_id')
        ->where('partners.still_active', 0)
        ->where('companies.company_id', $companyId)
        ->where('partners.balance', '<', 0)  // Balance < 0 (Negative)
        ->orderBy('partners.name', 'asc')
        ->get();

    // Fetch zero balance partners
    $zero_balance_partners = Partner::select('partners.name as partner_name', 'partners.balance as total_balance')
        ->join('company_assignments', 'partners.uuid', '=', 'company_assignments.partner_id')
        ->join('companies', 'company_assignments.company_id', '=', 'companies.company_id')
        ->where('partners.still_active', 0)
        ->where('companies.company_id', $companyId)
        ->where('partners.balance', '=', 0)  // Balance = 0 (Zero)
        ->orderBy('partners.name', 'asc')
        ->get();

        // return $zero_balance_partners;

    // Return the data as JSON
    return response()->json([
        'positive' => $positive_balance_partners,  // Positive balance partners
        'negative' => $negative_balance_partners, // Negative balance partners
        'zero' => $zero_balance_partners,         // Zero balance partners
    ]);

}



public function updateTitle(Request $request)
{
    $request->validate([
        'id' => 'required|integer',
        'title' => 'required|string|max:255',
    ]);

    $websiteTitle = DB::table('website_title')->where('id', $request->id)->update([
        'title' => $request->title
    ]);

    if ($websiteTitle) {
        return response()->json(['success' => true, 'message' => 'Title updated successfully!']);
    } else {
        return response()->json(['success' => false, 'message' => 'Failed to update title.']);
    }
}



}
