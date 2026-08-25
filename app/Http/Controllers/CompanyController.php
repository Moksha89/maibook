<?php
namespace App\Http\Controllers;


use App\Models\Company;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\View\View;

use Illuminate\Support\Str;

use Illuminate\Support\Facades\Response; // For using Response::json
use App\Models\Transaction;
use App\Models\Partner;
use App\Models\UserCompanyAccess;



class CompanyController extends Controller
{


public function getCompanyData()
{
    if (Auth::user()->is_admin) {
        // Admin: Retrieve data for all active companies and set access_level to 'full'
        // $companies = Company::leftJoin('company_assignments as ca', 'ca.company_id', '=', 'companies.company_id')
        //     ->leftJoin('partners as p', 'p.uuid', '=', 'ca.partner_id')
        //     ->select(
        //         'companies.name',
        //         'companies.id',
        //         'companies.company_id',
        //         DB::raw('COUNT(ca.partner_id) AS total_partners'),
        //         DB::raw('COALESCE(SUM(CASE WHEN p.balance IS NOT NULL THEN p.balance ELSE 0 END), 0) AS company_balance'),
        //         DB::raw('SUM(CASE WHEN p.still_active = 1 THEN 1 ELSE 0 END) AS active_partners'),
        //         DB::raw('SUM(CASE WHEN p.still_active = 0 THEN 1 ELSE 0 END) AS inactive_partners')
        //     )
        //     ->where('companies.still_active', 1) // Filter only active companies
        //     ->groupBy('companies.id', 'companies.company_id', 'companies.name')
        //     ->orderBy('companies.id', 'ASC')
        //     ->get();




        $companies = Company::leftJoin('company_assignments as ca', 'ca.company_id', '=', 'companies.company_id')
    ->leftJoin('partners as p', 'p.uuid', '=', 'ca.partner_id')
    ->select(
        'companies.name',
        'companies.id',
        'companies.company_id',
        DB::raw('COUNT(DISTINCT CASE WHEN p.uuid IS NOT NULL THEN ca.partner_id END) AS total_partners'),
        DB::raw('COALESCE(SUM(CASE WHEN p.balance IS NOT NULL THEN p.balance ELSE 0 END), 0) AS company_balance'),
        DB::raw('SUM(CASE WHEN p.still_active = 1 AND p.uuid IS NOT NULL THEN 1 ELSE 0 END) AS active_partners'),
        DB::raw('SUM(CASE WHEN p.still_active = 0 AND p.uuid IS NOT NULL THEN 1 ELSE 0 END) AS inactive_partners')
    )
    ->where('companies.still_active', 1) // Filter only active companies
    ->groupBy('companies.id', 'companies.company_id', 'companies.name')
    ->orderBy('companies.name', 'ASC')
    ->get();





        // Set access_level to 'full' for each company
        foreach ($companies as $company) {
            $company->access_level = 'full';
        }
    } else {
        // Non-admin user: Retrieve accessible company IDs and access levels
        $companyAccess = DB::table('user_company_access')
            ->where('user_id', Auth::user()->id)
            ->pluck('access_level', 'company_id'); // Retrieve access_level and company_id

        $companyIds = $companyAccess->keys()->all(); // Get all company IDs

        // $companies = Company::leftJoin('company_assignments as ca', 'ca.company_id', '=', 'companies.company_id')
        //     ->leftJoin('partners as p', 'p.uuid', '=', 'ca.partner_id')
        //     ->select(
        //         'companies.name',
        //         'companies.id',
        //         'companies.company_id',
        //         DB::raw('COUNT(ca.partner_id) AS total_partners'),
        //         DB::raw('COALESCE(SUM(CASE WHEN p.balance IS NOT NULL THEN p.balance ELSE 0 END), 0) AS company_balance'),
        //         DB::raw('SUM(CASE WHEN p.still_active = 1 THEN 1 ELSE 0 END) AS active_partners'),
        //         DB::raw('SUM(CASE WHEN p.still_active = 0 THEN 1 ELSE 0 END) AS inactive_partners')
        //     )
        //     ->where('companies.still_active', 1) // Filter only active companies
        //     ->whereIn('companies.id', $companyIds) // Filter by accessible company IDs
        //     ->groupBy('companies.id', 'companies.company_id', 'companies.name')
        //     ->orderBy('companies.id', 'ASC')
        //     ->get();




        $companies = Company::leftJoin('company_assignments as ca', 'ca.company_id', '=', 'companies.company_id')
    ->leftJoin('partners as p', 'p.uuid', '=', 'ca.partner_id')
    ->select(
        'companies.name',
        'companies.id',
        'companies.company_id',
        DB::raw('COUNT(DISTINCT CASE WHEN p.uuid IS NOT NULL THEN ca.partner_id END) AS total_partners'),
        DB::raw('COALESCE(SUM(CASE WHEN p.balance IS NOT NULL THEN p.balance ELSE 0 END), 0) AS company_balance'),
        DB::raw('SUM(CASE WHEN p.still_active = 1 AND p.uuid IS NOT NULL THEN 1 ELSE 0 END) AS active_partners'),
        DB::raw('SUM(CASE WHEN p.still_active = 0 AND p.uuid IS NOT NULL THEN 1 ELSE 0 END) AS inactive_partners')
    )
    ->where('companies.still_active', 1) // Filter only active companies
    ->whereIn('companies.id', $companyIds) // Filter by accessible company IDs
    ->groupBy('companies.id', 'companies.company_id', 'companies.name')
    ->orderBy('companies.name', 'ASC')
    ->get();

        
        // Attach access levels to each company record for the non-admin user
        foreach ($companies as $company) {
            $company->access_level = $companyAccess[$company->id] ?? 'none';
        }
    }

    return $companies;
}



     public function getInactiveCompanyData()
    {
$companies = Company::leftJoin('company_assignments as ca', 'ca.company_id', '=', 'companies.company_id')
    ->leftJoin('partners as p', 'p.uuid', '=', 'ca.partner_id')
    ->select(
        'companies.name',
        'companies.id',
        'companies.company_id',
        DB::raw('COUNT(ca.partner_id) AS total_partners'),
        DB::raw('COALESCE(SUM(CASE WHEN p.balance IS NOT NULL THEN p.balance ELSE 0 END), 0) AS company_balance'),
        DB::raw('SUM(CASE WHEN p.still_active = 1 THEN 1 ELSE 0 END) AS active_partners'),
        DB::raw('SUM(CASE WHEN p.still_active = 0 THEN 1 ELSE 0 END) AS inactive_partners')
    )
    ->where('companies.still_active', 0) // Filter only active companies
    ->groupBy('companies.id', 'companies.company_id', 'companies.name') // Add 'companies.id' to GROUP BY clause
    ->orderBy('companies.id', 'ASC')
    ->get();




        return $companies;
    }




public function createCompany(Request $request)
{
    // Validate the request, including a unique check for the name in the companies table
    $validatedData = $request->validate([
        'name' => 'required|string|max:255|unique:companies,name',
    ]);

    // Generate a random company ID of 50 characters
    $company_id = Str::random(50);

    $companyName = Str::upper($validatedData['name']);

    // Insert the company details into the database using Eloquent
    $company = Company::create([
        'name' => $companyName,
        'company_id' => $company_id,
    ]);

    // Check if the authenticated user is a manager
    if (Auth::user()->is_manager) {
        // Add entry in user_access_table with full access level for the manager
        UserCompanyAccess::create([
            'user_id' => Auth::user()->id,
            'company_id' => $company->id, // Use the actual ID of the company created
            'access_level' => 'full',
        ]);
    }

    // Return success response
    return response()->json(['success' => 'Successfully created company']);
}


    

public function editCompany(Request $request)
{
    // Validate the request data, checking if name is unique (ignoring the current company)
    $request->validate([
        'name' => 'required|string|max:255|unique:companies,name,' . $request->id,
    ]);

    // Find the company by ID
    $company = Company::find($request->id);

    if (!$company) {
        return response()->json(['success' => false, 'message' => 'Company not found.'], 404);
    }

    // Update company name
     $company->name = Str::upper($request->input('name'));
    $company->save();

    return response()->json(['success' => true]);
}


public function makeInactive(Request $request, $id)
{
    $company = Company::where('id',$request->id)->first();
    $company->still_active = 0; // or however your column is named
    $company->save();

    return response()->json(['success' => true]);
}


public function makeactive(Request $request, $id)
{
    $company = Company::where('id',$request->id)->first();
    $company->still_active = 1; // or however your column is named
    $company->save();

    return response()->json(['success' => true]);
}


public function getCompanyInfobyuser(Request $request)
    {
        // Get the company_id from the query parameters
        $company_id = $request->query('companyID');
        $partner_id = $request->query('partner_id');

        // Validate required fields
        if (empty($company_id)) {
            return Response::json(['error' => 'Company ID is required.'], 400);
        }

        try {
            // Retrieve company info along with the total balance of assigned partners
            $company = DB::table('companies as c')
                ->leftJoin('company_assignments as ca', 'ca.company_id', '=', 'c.company_id')
                ->leftJoin('partners as p', 'p.uuid', '=', 'ca.partner_id')
                ->select('c.name', DB::raw('COALESCE(SUM(p.balance), 0) AS total_balance'))
                ->where('c.company_id', $company_id)
                ->groupBy('c.company_id', 'c.name') // Add c.name to groupBy to avoid ONLY_FULL_GROUP_BY issue
                ->first();

            if (!$company) {
                return Response::json(['error' => 'Company not found.'], 404);
            }



 if(Auth::user()->is_admin)
        {
          $access_level="full";
        }
        else
        {


$c_id=Company::where('company_id',$company_id)->first();

            //get from db
            $gg=UserCompanyAccess::where('company_id',$c_id->id)->where('user_id',Auth::user()->id)->first();
            if($gg)
            {
                $access_level=$gg->access_level;
            }
            else
            {
                $access_level="read";
            }

        }




            // Retrieve active and inactive partners with balances
            $partners = DB::table('partners as p')
                ->join('company_assignments as ca', 'ca.partner_id', '=', 'p.uuid')
                ->select('p.uuid as id', 'p.name', 'p.balance', DB::raw("CASE WHEN p.still_active = 1 THEN 'active' ELSE 'inactive' END AS status"))
                ->where('ca.company_id', $company_id)
                ->where('p.uuid', $partner_id)
                ->orderBy('p.still_active', 'DESC')
                ->get();

            // Initialize arrays for active and inactive partners
            $active_partners = [];
            $inactive_partners = [];
            $s_n = 1; // Serial number counter

            foreach ($partners as $partner) {
                $partner->s_n = $s_n++; // Add serial number

                if ($partner->status === 'active') {
                    unset($partner->status); // Remove status field for active partners
                    $active_partners[] = $partner;
                } else {
                    unset($partner->status); // Remove status field for inactive partners
                    $inactive_partners[] = $partner;
                }
            }

            // Prepare response
            $response = [
                'company' => [
                    'name' => $company->name,
                    'total_balance' => $company->total_balance,
                    'active_partners' => $active_partners,
                    'inactive_partners' => $inactive_partners,
                    'access_level'=>$access_level,
                ],
                // 'success' => 'Company and partner data retrieved successfully.'
            ];

            // return Response::json($response, 200);
            return view('companydetailsinactive',compact('response'));

        } catch (Exception $e) {
            // Catch any exceptions and return an error message
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }



public function getCompanyInfo(Request $request)
    {
        // Get the company_id from the query parameters
        $company_id = $request->query('companyID');

        // Validate required fields
        if (empty($company_id)) {
            return Response::json(['error' => 'Company ID is required.'], 400);
        }

        try {
            // Retrieve company info along with the total balance of assigned partners
            $company = DB::table('companies as c')
                ->leftJoin('company_assignments as ca', 'ca.company_id', '=', 'c.company_id')
                ->leftJoin('partners as p', 'p.uuid', '=', 'ca.partner_id')
                ->select('c.name', DB::raw('COALESCE(SUM(p.balance), 0) AS total_balance'))
                ->where('c.company_id', $company_id)
                ->groupBy('c.company_id', 'c.name') // Add c.name to groupBy to avoid ONLY_FULL_GROUP_BY issue
                ->first();

            if (!$company) {
                return Response::json(['error' => 'Company not found.'], 404);
            }



 if(Auth::user()->is_admin)
        {
          $access_level="full";
        }
        else
        {


$c_id=Company::where('company_id',$company_id)->first();

            //get from db
            $gg=UserCompanyAccess::where('company_id',$c_id->id)->where('user_id',Auth::user()->id)->first();
            if($gg)
            {
                $access_level=$gg->access_level;
            }
            else
            {
                $access_level="read";
            }

        }




            // Retrieve active and inactive partners with balances
            $partners = DB::table('partners as p')
                ->join('company_assignments as ca', 'ca.partner_id', '=', 'p.uuid')
                ->select('p.uuid as id', 'p.name', 'p.balance', DB::raw("CASE WHEN p.still_active = 1 THEN 'active' ELSE 'inactive' END AS status"))
                ->where('ca.company_id', $company_id)
                ->orderBy('p.still_active', 'DESC')
                ->get();

            // Initialize arrays for active and inactive partners
            $active_partners = [];
            $inactive_partners = [];
            $s_n = 1; // Serial number counter

            foreach ($partners as $partner) {
                $partner->s_n = $s_n++; // Add serial number

                if ($partner->status === 'active') {
                    unset($partner->status); // Remove status field for active partners
                    $active_partners[] = $partner;
                } else {
                    unset($partner->status); // Remove status field for inactive partners
                    $inactive_partners[] = $partner;
                }
            }

           // Sort the active partners array using usort
usort($active_partners, function($a, $b) {
    return strcmp($a->name, $b->name); // Compare names alphabetically
});

            // Prepare response
            $response = [
                'company' => [
                    'name' => $company->name,
                    'total_balance' => $company->total_balance,
                    'active_partners' => $active_partners,
                    'inactive_partners' => $inactive_partners,
                    'access_level'=>$access_level,
                ],
                // 'success' => 'Company and partner data retrieved successfully.'
            ];

            // return Response::json($response, 200);
            return view('companydetails',compact('response'));

        } catch (Exception $e) {
            // Catch any exceptions and return an error message
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }


public function getCompanyInfoajax(Request $request)
    {
        // Get the company_id from the query parameters
        $company_id = $request->query('companyID');

        // Validate required fields
        if (empty($company_id)) {
            return Response::json(['error' => 'Company ID is required.'], 400);
        }

        try {
            // Retrieve company info along with the total balance of assigned partners
            $company = DB::table('companies as c')
                ->leftJoin('company_assignments as ca', 'ca.company_id', '=', 'c.company_id')
                ->leftJoin('partners as p', 'p.uuid', '=', 'ca.partner_id')
                ->select('c.name', DB::raw('COALESCE(SUM(p.balance), 0) AS total_balance'))
                ->where('c.company_id', $company_id)
                ->groupBy('c.company_id', 'c.name') // Add c.name to groupBy to avoid ONLY_FULL_GROUP_BY issue
                ->first();

            if (!$company) {
                return Response::json(['error' => 'Company not found.'], 404);
            }



 if(Auth::user()->is_admin)
        {
          $access_level="full";
        }
        else
        {


$c_id=Company::where('company_id',$company_id)->first();

            //get from db
            $gg=UserCompanyAccess::where('company_id',$c_id->id)->where('user_id',Auth::user()->id)->first();
            if($gg)
            {
                $access_level=$gg->access_level;
            }
            else
            {
                $access_level="read";
            }

        }









            // Retrieve active and inactive partners with balances
            $partners = DB::table('partners as p')
                ->join('company_assignments as ca', 'ca.partner_id', '=', 'p.uuid')
                ->select('p.uuid as id', 'p.name', 'p.balance', DB::raw("CASE WHEN p.still_active = 1 THEN 'active' ELSE 'inactive' END AS status"))
                ->where('ca.company_id', $company_id)
                ->orderBy('p.still_active', 'DESC')
                ->get();

            // Initialize arrays for active and inactive partners
            $active_partners = [];
            $inactive_partners = [];


           $active_s_n = 1; // Serial number counter for active partners
$inactive_s_n = 1; // Serial number counter for inactive partners

foreach ($partners as $partner) {
    if ($partner->status === 'active') {
        $partner->s_n = $active_s_n++; // Assign serial number for active partners
        unset($partner->status); // Remove status field for active partners
        $active_partners[] = $partner;
    } else {
        $partner->s_n = $inactive_s_n++; // Assign serial number for inactive partners
        unset($partner->status); // Remove status field for inactive partners
        $inactive_partners[] = $partner;
    }
}


            // Prepare response
            $response = [
                'company' => [
                    'name' => $company->name,
                    'total_balance' => $company->total_balance,
                    'active_partners' => $active_partners,
                    'inactive_partners' => $inactive_partners,
                     'access_level'=>$access_level,
                ],
                // 'success' => 'Company and partner data retrieved successfully.'
            ];

             return Response::json($response, 200);
            

        } catch (Exception $e) {
            // Catch any exceptions and return an error message
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }



// public function getTransactions(Request $request)
//     {
//         // Validate incoming request
//         $request->validate([
//             'partner_id' => 'required|string',
//             'user_id' => 'required|string',
//             'limit' => 'required|integer',
//             'page' => 'required|integer'
//         ]);

//         // Retrieve parameters
//         $partnerId = $request->partner_id;
//         $userId = $request->user_id;
//         $limit = $request->limit;
//         $page = $request->page;

//         // Calculate offset
//         $offset = ($page - 1) * $limit;

//         // Your SQL query here (as shown previously)
// $sql = "
//     SELECT 
//         t.transaction_id, 
//         t.name_id, 
//         n_partner.name AS name_id_name,  -- Fetch the name associated with name_id
//         t.product_id, 
//         t.modified, 
//         t.deleted, 
//         p_partner.name AS product_id_name,  -- Fetch the name associated with product_id
//         CASE 
//             -- If partner_id is in name_id and coins are positive, make coins negative
//             WHEN t.name_id = '$partnerId' AND t.coins > 0 THEN -t.coins  
//             -- If partner_id is in product_id and coins are negative, keep them as is
//             WHEN t.product_id = '$partnerId' AND t.coins < 0 THEN t.coins
//             -- Otherwise, if coins are negative, make them positive
//             WHEN t.coins < 0 THEN ABS(t.coins)
//             ELSE t.coins  -- Otherwise, leave coins as is
//         END AS coins, 
//         t.rate, 
//         t.remarks, 
//         CASE 
//             WHEN t.name_id = '$partnerId' THEN t.name_opening_balance  -- Use name's opening balance if name_id matches
//             WHEN t.product_id = '$partnerId' THEN t.product_opening_balance  -- Use product's opening balance if product_id matches
//             ELSE NULL  -- Otherwise, set to NULL
//         END AS opening_balance,
//         CASE 
//             WHEN t.name_id = '$partnerId' THEN t.name_closing_balance  -- Use name's closing balance if name_id matches
//             WHEN t.product_id = '$partnerId' THEN t.product_closing_balance  -- Use product's closing balance if product_id matches
//             ELSE NULL  -- Otherwise, set to NULL
//         END AS closing_balance,
//         t.timestamp, 
//         CASE 
//             -- If partner_id is in product_id and coins are positive, show coins * rate in credit
//             WHEN t.product_id = '$partnerId' AND t.coins > 0 THEN t.coins * t.rate
//             -- If partner_id is in name_id and coins are negative, show positive coins * rate in credit
//             WHEN t.name_id = '$partnerId' AND t.coins < 0 THEN ABS(t.coins * t.rate)
//             -- If partner_id is in product_id and coins are negative, set credit to NULL
//             WHEN t.product_id = '$partnerId' AND t.coins < 0 THEN NULL
//             ELSE 0 
//         END AS credit,  
//         CASE 
//             -- If partner_id is in name_id and coins are positive, show coins * rate in debit
//             WHEN t.name_id = '$partnerId' AND t.coins > 0 THEN ABS(t.coins * t.rate)  
//             -- If partner_id is in product_id and coins are negative, show debit as coins * rate
//             WHEN t.product_id = '$partnerId' AND t.coins < 0 THEN ABS(t.coins * t.rate)
//             -- Otherwise, leave debit as NULL
//             ELSE 0 
//         END AS debit,  
//         c.name AS company_name,  -- Fetch the company name
//         c.company_id  -- Fetch the company ID
//     FROM 
//         transactions t
//     INNER JOIN 
//         partners p_partner ON t.product_id = p_partner.uuid  -- Join to get product_id name
//     INNER JOIN 
//         partners n_partner ON t.name_id = n_partner.uuid  -- Join to get name_id name
//     LEFT JOIN 
//         company_assignments ca ON p_partner.uuid = ca.partner_id  -- Join to get partner's company
//     LEFT JOIN 
//         companies c ON ca.company_id = c.company_id  -- Join to get company details
//     WHERE 
//         (t.product_id = '$partnerId' OR t.name_id = '$partnerId')  -- Filter by partner_id (as product_id or name_id)
//     ORDER BY 
//         t.timestamp ASC
//     LIMIT $limit OFFSET $offset;  -- Apply pagination
// ";

//         // Execute the query
//         $transactions = DB::select($sql);

//         // Get total count for pagination
//         $totalTransactions = DB::table('transactions')->where('product_id', $partnerId)->orWhere('name_id', $partnerId)->count();

// $url = route('generate.transaction.report', ['partner_id' => $partnerId, 'user_id' => $userId]);

//         // Calculate total pages
//         $totalPages = ceil($totalTransactions / $limit);

//         return response()->json([
//             'transactions' => $transactions,
//             'pagination' => [
//                 'current_page' => $page,
//                 'total_pages' => $totalPages,
//             ],
//             'print_url'=>$url,
//         ]);
//     }

public function getTransactions(Request $request)
{
    // Validate incoming request
    $request->validate([
        'partner_id' => 'required|string',
        'user_id' => 'required|string',
    ]);

    // Retrieve parameters
    $partnerId = $request->partner_id;

        $userId = $request->user_id;
    // Your SQL query here (remove LIMIT and OFFSET)
    // $sql = "
    //     SELECT 
    //         t.transaction_id, 
    //         t.name_id, 
    //         n_partner.name AS name_id_name, 
    //         t.product_id, 
    //         t.modified, 
    //         t.deleted, 
    //         p_partner.name AS product_id_name, 
    //         CASE 
    //             WHEN t.name_id = '$partnerId' AND t.coins > 0 THEN -t.coins  
    //             WHEN t.product_id = '$partnerId' AND t.coins < 0 THEN t.coins
    //             WHEN t.coins < 0 THEN ABS(t.coins)
    //             ELSE t.coins
    //         END AS coins, 
    //         t.rate, 
    //         t.remarks, 
    //         CASE 
    //             WHEN t.name_id = '$partnerId' THEN t.name_opening_balance  
    //             WHEN t.product_id = '$partnerId' THEN t.product_opening_balance  
    //             ELSE NULL
    //         END AS opening_balance,
    //         CASE 
    //             WHEN t.name_id = '$partnerId' THEN t.name_closing_balance  
    //             WHEN t.product_id = '$partnerId' THEN t.product_closing_balance  
    //             ELSE NULL
    //         END AS closing_balance,
    //         t.timestamp, 
    //         CASE 
    //             WHEN t.product_id = '$partnerId' AND t.coins > 0 THEN t.coins * t.rate
    //             WHEN t.name_id = '$partnerId' AND t.coins < 0 THEN ABS(t.coins * t.rate)
    //             WHEN t.product_id = '$partnerId' AND t.coins < 0 THEN NULL
    //             ELSE 0 
    //         END AS credit,  
    //         CASE 
    //             WHEN t.name_id = '$partnerId' AND t.coins > 0 THEN ABS(t.coins * t.rate)  
    //             WHEN t.product_id = '$partnerId' AND t.coins < 0 THEN ABS(t.coins * t.rate)
    //             ELSE 0 
    //         END AS debit,  
    //         c.name AS company_name,  
    //         c.company_id  
    //     FROM 
    //         transactions t
    //     INNER JOIN 
    //         partners p_partner ON t.product_id = p_partner.uuid
    //     INNER JOIN 
    //         partners n_partner ON t.name_id = n_partner.uuid
    //     LEFT JOIN 
    //         company_assignments ca ON p_partner.uuid = ca.partner_id
    //     LEFT JOIN 
    //         companies c ON ca.company_id = c.company_id
    //     WHERE 
    //         (t.product_id = '$partnerId' OR t.name_id = '$partnerId')
    //     ORDER BY 
    //         t.timestamp ASC
    // ";




$sql = "
    SELECT 
        t.transaction_id, 
        t.name_id, 
        n_partner.name AS name_id_name, 
        t.product_id, 
        t.modified, 
        t.deleted, 
        p_partner.name AS product_id_name, 
        CASE 
            WHEN t.name_id = '$partnerId' AND t.coins > 0 THEN -t.coins  
            WHEN t.product_id = '$partnerId' AND t.coins < 0 THEN t.coins
            WHEN t.coins < 0 THEN ABS(t.coins)
            ELSE t.coins
        END AS coins, 
        t.rate, 
        t.remarks, 
        CASE 
            WHEN t.name_id = '$partnerId' THEN t.name_opening_balance  
            WHEN t.product_id = '$partnerId' THEN t.product_opening_balance  
            ELSE NULL
        END AS opening_balance,
        CASE 
            WHEN t.name_id = '$partnerId' THEN t.name_closing_balance  
            WHEN t.product_id = '$partnerId' THEN t.product_closing_balance  
            ELSE NULL
        END AS closing_balance,
        t.timestamp, 
        CASE 
            WHEN t.product_id = '$partnerId' AND t.coins > 0 THEN ROUND(t.coins * t.rate)
            WHEN t.name_id = '$partnerId' AND t.coins < 0 THEN ROUND(ABS(t.coins * t.rate))
            WHEN t.product_id = '$partnerId' AND t.coins < 0 THEN NULL
            ELSE 0 
        END AS credit,  
        CASE 
            WHEN t.name_id = '$partnerId' AND t.coins > 0 THEN ROUND(ABS(t.coins * t.rate))  
            WHEN t.product_id = '$partnerId' AND t.coins < 0 THEN ROUND(ABS(t.coins * t.rate))
            ELSE 0 
        END AS debit,  
        c.name AS company_name,  
        c.company_id  
    FROM 
        transactions t
    INNER JOIN 
        partners p_partner ON t.product_id = p_partner.uuid
    INNER JOIN 
        partners n_partner ON t.name_id = n_partner.uuid
    LEFT JOIN 
        company_assignments ca ON p_partner.uuid = ca.partner_id
    LEFT JOIN 
        companies c ON ca.company_id = c.company_id
    WHERE 
        (t.product_id = '$partnerId' OR t.name_id = '$partnerId')
    ORDER BY 
        t.timestamp ASC
";





    // Execute the query
    $transactions = DB::select($sql);


$url = route('generate.transaction.report', ['partner_id' => $partnerId, 'user_id' => $userId]);

     

        return response()->json([
            'transactions' => $transactions,
            
            'print_url'=>$url,
        ]);



}




// Helper function to generate URL with query parameters
private function generateUrl($path, $params)
{
    $query = http_build_query($params);
    return url($path . '?' . $query);
}




public function getCompanyPartners(Request $request)
{
    // Retrieve company_id from query parameters
    $companyId = $request->query('companyID');
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

        // Initialize total balances and arrays for positive and negative balances
        $totalPositiveBalance = 0;
        $totalNegativeBalance = 0;
        $positiveBalances = [];
        $negativeBalances = [];

        // Categorize partners based on their balances
        foreach ($partners as $partner) {
            if ($partner->total_balance > 0) {
                $positiveBalances[] = [
                    'partner_name' => $partner->partner_name,
                    'total_balance' => $partner->total_balance
                ];
                $totalPositiveBalance += $partner->total_balance;
            } elseif($partner->total_balance!=0 && $partner->total_balance < 0) {
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

        // Prepare response
        $response = [
            'positive_balances' => $positiveBalances,
            'negative_balances' => $negativeBalances
        ];

        return response()->json($response, 200);

    } catch (\Exception $e) {
        // Handle database errors
        return response()->json(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}



public function updateCompany(Request $request)
{
    $request->validate([
        'company_id' => 'required',
        'name' => 'required|string|max:255'
    ]);

    try {
        // Check if the company name already exists for a different company
        $existingCompany = Company::where('name', $request->name)
            ->where('company_id', '!=', $request->company_id)
            ->first();

        if ($existingCompany) {
            return response()->json(['error' => 'Company name already exists.'], 400);
        }

        // Find the company by ID and update the name
        $company = Company::where('company_id', $request->company_id)->first();
        if ($company) {
            $company->name = $request->name;
            $company->save();

            return response()->json(['success' => 'Company name updated successfully.']);
        } else {
            return response()->json(['error' => 'Company not found.'], 404);
        }
    } catch (\Exception $e) {
        return response()->json(['error' => 'An error occurred while updating the company.'], 500);
    }
}





}
