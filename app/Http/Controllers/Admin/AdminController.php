<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
require base_path('vendor_pdf/autoload.php');
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Partner;
use App\Models\Company;
use App\Models\UserCompanyAccess;
use App\Models\Transaction;
use Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AdminController extends Controller
{
    // Example method
    public function all_backup()
    {

        // Retrieve backups ordered by created_at timestamp in descending order
$Backup = DB::table('backups')->orderBy('timestamp', 'desc')->get();


        return view('admin.dashboard',compact('Backup'));
    }



public function all_companies()
{
    $companies = Company::orderBy('id', 'desc')->get(); // Order by ID descending
    return view('admin.all_companies', compact('companies'));
}






public function company_assignments()
{
    $data = DB::table('company_assignments')
        ->leftJoin('partners', 'company_assignments.partner_id', '=', 'partners.uuid')
        ->leftJoin('companies', 'company_assignments.company_id', '=', 'companies.company_id')
        ->select(
            'company_assignments.*',
            'partners.name as partner_name',
            'companies.name as company_name'
        )
        ->orderBy('company_assignments.id', 'desc') // Order by ID descending
        ->get()
        ->map(function ($item) {
            $item->formatted_timestamp = Carbon::createFromTimestamp($item->timestamp)->format('d-m-Y H:i:s');
            return $item;
        });

    $all_partners = DB::table('partners')->orderBy('id', 'desc')->get(); // Order partners by ID descending
    $all_campanies = DB::table('companies')->orderBy('id', 'desc')->get(); // Order companies by ID descending

    return view('admin.company_assignments', compact('data', 'all_campanies', 'all_partners'));
}

    public function company_assignments_edit($id)
    {
        $assignment = DB::table('company_assignments')->where('id', $id)->first();
        return response()->json($assignment);
    }

    public function company_assignments_update(Request $request, $id)
    {
       
        DB::table('company_assignments')
            ->where('id', $id)
            ->update([
              
                'company_id' => $request->company_id,
              
            ]);

        return redirect()->route('company_assignments')->with('success', 'Assignment updated successfully.');
    }

    public function company_assignments_destroy($id)
    {
        DB::table('company_assignments')->where('id', $id)->delete();
        return redirect()->route('company_assignments')->with('success', 'Assignment deleted successfully.');
    }




public function logo()
{
    $website_title=DB::table('website_title')->first();
   

    // Return the view with the users, companies, and backups
    return view('admin.logo', compact('website_title'));
}










public function partner()
{
    $partners = DB::table('partners')
        ->leftJoin('company_assignments', 'company_assignments.partner_id', '=', 'partners.uuid')
        ->leftJoin('companies', 'company_assignments.company_id', '=', 'companies.company_id')
        ->select(
            'partners.*',
            'partners.name as partner_name',
            'companies.name as company_name'
        )
        ->orderBy('partners.id', 'desc') // Order by ID descending
        ->get(); // Get all records

    $companies = Company::where('still_active', 1)->get();

    return view('admin.partner', compact('partners', 'companies'));
}



public function update(Request $request)
{
    $request->validate([
        'id' => 'required|exists:partners,id',
        'name' => 'required|string|max:255',
    ]);

    $partner = Partner::find($request->id);
    $partner->name = $request->name;
    $partner->save();

    return response()->json(['success' => 'Partner updated successfully']);
}



public function delete(Request $request)
{
    $request->validate([
        'id' => 'required|exists:partners,id', // Ensure the partner ID exists in the database
    ]);

    $partner = Partner::find($request->id);

    if (!$partner) {
        return response()->json(['message' => 'Partner not found'], 404);
    }

    $partner->delete();

    return response()->json(['success' => 'Partner deleted successfully']);
}





public function admin_transaction()
{
    $sql = "
    SELECT 
        t.*,
        n_partner.name AS name_id_name, 
       
        p_partner.name AS product_id_name, 
        
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
   
    ORDER BY 
        t.timestamp DESC
";





    // Execute the query
    $transactions = DB::select($sql);




    $all_partners=DB::table('partners')->get();

$companies = Company::where('still_active',1)->get();

    return view('admin.transactions',compact('transactions','all_partners','companies'));
}




public function user()
{
    $users = DB::table('users')->orderBy('id', 'desc')->get(); // Order users by ID descending
    $companies = Company::where('still_active', 1)->orderBy('id', 'desc')->get(); // Order companies by ID descending

    return view('admin.user', compact('users', 'companies'));
}



public function destroy($id)
{
    $user = User::find($id);

    if (!$user) {
        return response()->json(['message' => 'User not found.'], 404);
    }

    try {
        $user->delete();
        return response()->json(['message' => 'User deleted successfully.']);
    } catch (\Exception $e) {
        return response()->json(['message' => 'Failed to delete user.'], 500);
    }
}


public function user_company_access()
{
    $data = UserCompanyAccess::with('user', 'company')->orderBy('id', 'desc')->get(); // Order by ID descending
    $all_users = DB::table('users')->orderBy('id', 'desc')->get(); // Order users by ID descending
    $all_campanies = DB::table('companies')->orderBy('id', 'desc')->get(); // Order companies by ID descending

    return view('admin.user_company_access', compact('data', 'all_users', 'all_campanies'));
}



public function user_company_access_edit($id)
    {
        $assignment = DB::table('user_company_access')->where('id', $id)->first();
        return response()->json($assignment);
    }

    public function user_company_access_update(Request $request, $id)
    {
       
        DB::table('user_company_access')
            ->where('id', $id)
            ->update([
              
                'access_level' => $request->access_level,
              
            ]);

        return redirect()->route('user_company_access')->with('success', 'Access updated successfully.');
    }

    public function user_company_access_destroy($id)
    {
        DB::table('user_company_access')->where('id', $id)->delete();
        return redirect()->route('user_company_access')->with('success', 'Access deleted successfully.');
    }






    public function store(Request $request)
    {

        

        $request->validate([
            'transaction_id' => 'nullable|exists:transactions,transaction_id',
            'name_id' => 'required',
            'product_id' => 'required',
           'coins' => 'required|numeric|not_in:0',

            'rate' => 'required|numeric|min:0.00001|max:1',
            'remarks' => 'nullable|string|max:255',
        ]);

       

            try {
        $isNewTransaction = !$request->has('transaction_id');
        $transactionId = $request->transaction_id;

       
       // Fetch sender and receiver
            $sender = Partner::findByUuid($request->name_id);
            $receiver = Partner::findByUuid($request->product_id);

        if (empty($transactionId)) {
            // **1. CREATE NEW TRANSACTION**



    // Determine the operation type based on coins value
    $isDebit = $request->coins > 0; // Positive coins = debit
    $isCredit = $request->coins < 0; // Negative coins = credit

    // Calculate balances
    $senderOpeningBalance = $sender->balance;
    $receiverOpeningBalance = $receiver->balance;

    if ($isDebit) {
        // Debit from sender, credit to receiver
        $senderClosingBalance = $senderOpeningBalance - $request->coins;
        $receiverClosingBalance = $receiverOpeningBalance + $request->coins;
    } elseif ($isCredit) {
        // Credit to sender, debit from receiver
        $senderClosingBalance = $senderOpeningBalance - $request->coins; // Subtracting a negative = adding
        $receiverClosingBalance = $receiverOpeningBalance + $request->coins; // Adding a negative = subtracting
    }




            // // Update balances
            // $sender->update(['balance' => $senderClosingBalance]);
            // $receiver->update(['balance' => $receiverClosingBalance]);

            // Insert transaction
            $transaction = Transaction::create([
                'transaction_id' => uniqid('txn_'),
                'name_id' => $request->name_id,
                'product_id' => $request->product_id,
                'coins' => $request->coins,
                'rate' => $request->rate,
                'remarks' => $request->remarks,
                'product_opening_balance' => $receiverOpeningBalance,
                'product_closing_balance' => $receiverClosingBalance,
                'name_opening_balance' => $senderOpeningBalance,
                'name_closing_balance' => $senderClosingBalance,
                'timestamp' => now()->timestamp,
            ]);


 $this->updateBalances($request);


        } else {


 $transaction = Transaction::where('transaction_id', $transactionId)->first();


 $this->updatetrans($request,$transaction->id);
 $this->updateBalances($request);




        }

       

        

        return response()->json(['message' => 'Transaction processed successfully.'], 200);
    } catch (\Exception $e) {
        
        return response()->json(['error' => $e->getMessage()], 400);
    }
    }




    public function updateBalances($request)
{
    $partnerId = $request->partner_id;
    $name_id = $request->name_id;

    // Calculate balances for both partner_id and name_id
    $this->calculateBalance($partnerId, $request);
    $this->calculateBalance($name_id, $request);
}

public function calculateBalance($partnerId, $request)
{
    // SQL query to fetch all relevant transactions for the partner
$sql = "
    SELECT 
        t.transaction_id, 
        t.name_id, 
        n_partner.name AS name_id_name,  -- Fetch the name associated with name_id
        t.product_id, 
        t.modified, 
        t.deleted, 
        p_partner.name AS product_id_name,  -- Fetch the name associated with product_id
        CASE 
            -- If partner_id is in name_id and coins are positive, make coins negative
            WHEN t.name_id = '$partnerId' AND t.coins > 0 THEN -t.coins  
            -- If partner_id is in product_id and coins are negative, keep them as is
            WHEN t.product_id = '$partnerId' AND t.coins < 0 THEN t.coins
            -- Otherwise, if coins are negative, make them positive
            WHEN t.coins < 0 THEN ABS(t.coins)
            ELSE t.coins  -- Otherwise, leave coins as is
        END AS coins, 
        t.rate, 
        t.remarks, 
        CASE 
            WHEN t.name_id = '$partnerId' THEN t.name_opening_balance  -- Use name's opening balance if name_id matches
            WHEN t.product_id = '$partnerId' THEN t.product_opening_balance  -- Use product's opening balance if product_id matches
            ELSE NULL  -- Otherwise, set to NULL
        END AS opening_balance,
        CASE 
            WHEN t.name_id = '$partnerId' THEN t.name_closing_balance  -- Use name's closing balance if name_id matches
            WHEN t.product_id = '$partnerId' THEN t.product_closing_balance  -- Use product's closing balance if product_id matches
            ELSE NULL  -- Otherwise, set to NULL
        END AS closing_balance,
        t.timestamp, 
        CASE 
            -- If partner_id is in product_id and coins are positive, show coins * rate in credit
            WHEN t.product_id = '$partnerId' AND t.coins > 0 THEN t.coins * t.rate
            -- If partner_id is in name_id and coins are negative, show positive coins * rate in credit
            WHEN t.name_id = '$partnerId' AND t.coins < 0 THEN ROUND(ABS(t.coins * t.rate))
            -- If partner_id is in product_id and coins are negative, set credit to NULL
            WHEN t.product_id = '$partnerId' AND t.coins < 0 THEN NULL
            ELSE 0 
        END AS credit,  
        CASE 
            -- If partner_id is in name_id and coins are positive, show coins * rate in debit
            WHEN t.name_id = '$partnerId' AND t.coins > 0 THEN ROUND(ABS(t.coins * t.rate))  
            -- If partner_id is in product_id and coins are negative, show debit as coins * rate
            WHEN t.product_id = '$partnerId' AND t.coins < 0 THEN ROUND(ABS(t.coins * t.rate))
            -- Otherwise, leave debit as NULL
            ELSE 0 
        END AS debit,  
        c.name AS company_name,  -- Fetch the company name
        c.company_id  -- Fetch the company ID
    FROM 
        transactions t
    INNER JOIN 
        partners p_partner ON t.product_id = p_partner.uuid  -- Join to get product_id name
    INNER JOIN 
        partners n_partner ON t.name_id = n_partner.uuid  -- Join to get name_id name
    LEFT JOIN 
        company_assignments ca ON p_partner.uuid = ca.partner_id  -- Join to get partner's company
    LEFT JOIN 
        companies c ON ca.company_id = c.company_id  -- Join to get company details
    WHERE 
        (t.product_id = '$partnerId' OR t.name_id = '$partnerId')  -- Filter by partner_id (as product_id or name_id)
         AND t.deleted != 1 

    ORDER BY 
        t.timestamp DESC
";

// Execute query with parameter binding
$transactions = DB::select($sql);

// Calculate balance using aggregate logic
$balance = collect($transactions)->sum(function ($trans_rec) {
    return $trans_rec->coins * $trans_rec->rate;
});

// Round off the balance to the nearest integer
$roundedBalance = round($balance);

// Update the partner's balance
Partner::where('uuid', $partnerId)->update(['balance' => $roundedBalance]);

return $roundedBalance;


    // return $balance;
}






public function updatetrans(Request $request, $id)
{
    DB::transaction(function () use ($request, $id) {
        // Find the transaction to be updated
        $transaction = Transaction::findOrFail($id);

        // Get the affected `product_id` and `name_id`
        // $productId = $transaction->product_id;
        // $nameId = $transaction->name_id;


           $productId = $request->product_id;
        $nameId = $request->name_id;

        // Update the transaction data
        $transaction->product_id = $request->product_id;
        $transaction->name_id = $request->name_id;
        $transaction->coins = $request->coins;
        $transaction->rate = $request->rate;
        $transaction->remarks = $request->remarks;
        $transaction->modified = 1;
        $transaction->deleted = 0;

       // Recalculate balances for the updated transaction
$previousTransaction = Transaction::where('id', '<', $id)
    ->where(function ($query) use ($productId, $nameId) {
        $query->where('product_id', $productId)
              ->orWhere('name_id', $nameId);
    })
    ->orderBy('id', 'desc')
    ->first();

// Initialize opening balances based on the previous transaction
if ($previousTransaction) {
    $transaction->product_opening_balance = $previousTransaction->product_closing_balance;
    $transaction->name_opening_balance = $previousTransaction->name_closing_balance;
} else {
    // If no previous transaction exists, set opening balances to 0
    $transaction->product_opening_balance = 0;
    $transaction->name_opening_balance = 0;
}

// Calculate closing balances based on the opening balances and current coins
$transaction->product_closing_balance = $transaction->product_opening_balance + $transaction->coins;
$transaction->name_closing_balance = $transaction->name_opening_balance + $transaction->coins;


        $transaction->save();


$partnerId=$request->partner_id;

$sql = "
    SELECT 
        t.transaction_id, 
        t.name_id, 
        n_partner.name AS name_id_name,  -- Fetch the name associated with name_id
        t.product_id, 
        t.modified, 
        t.deleted, 
        p_partner.name AS product_id_name,  -- Fetch the name associated with product_id
        CASE 
            -- If partner_id is in name_id and coins are positive, make coins negative
            WHEN t.name_id = '$partnerId' AND t.coins > 0 THEN -t.coins  
            -- If partner_id is in product_id and coins are negative, keep them as is
            WHEN t.product_id = '$partnerId' AND t.coins < 0 THEN t.coins
            -- Otherwise, if coins are negative, make them positive
            WHEN t.coins < 0 THEN ABS(t.coins)
            ELSE t.coins  -- Otherwise, leave coins as is
        END AS coins, 
        t.rate, 
        t.remarks, 
        CASE 
            WHEN t.name_id = '$partnerId' THEN t.name_opening_balance  -- Use name's opening balance if name_id matches
            WHEN t.product_id = '$partnerId' THEN t.product_opening_balance  -- Use product's opening balance if product_id matches
            ELSE NULL  -- Otherwise, set to NULL
        END AS opening_balance,
        CASE 
            WHEN t.name_id = '$partnerId' THEN t.name_closing_balance  -- Use name's closing balance if name_id matches
            WHEN t.product_id = '$partnerId' THEN t.product_closing_balance  -- Use product's closing balance if product_id matches
            ELSE NULL  -- Otherwise, set to NULL
        END AS closing_balance,
        t.timestamp, 
        CASE 
            -- If partner_id is in product_id and coins are positive, show coins * rate in credit
            WHEN t.product_id = '$partnerId' AND t.coins > 0 THEN t.coins * t.rate
            -- If partner_id is in name_id and coins are negative, show positive coins * rate in credit
            WHEN t.name_id = '$partnerId' AND t.coins < 0 THEN ABS(t.coins * t.rate)
            -- If partner_id is in product_id and coins are negative, set credit to NULL
            WHEN t.product_id = '$partnerId' AND t.coins < 0 THEN NULL
            ELSE 0 
        END AS credit,  
        CASE 
            -- If partner_id is in name_id and coins are positive, show coins * rate in debit
            WHEN t.name_id = '$partnerId' AND t.coins > 0 THEN ABS(t.coins * t.rate)  
            -- If partner_id is in product_id and coins are negative, show debit as coins * rate
            WHEN t.product_id = '$partnerId' AND t.coins < 0 THEN ABS(t.coins * t.rate)
            -- Otherwise, leave debit as NULL
            ELSE 0 
        END AS debit,  
        c.name AS company_name,  -- Fetch the company name
        c.company_id  -- Fetch the company ID
    FROM 
        transactions t
    INNER JOIN 
        partners p_partner ON t.product_id = p_partner.uuid  -- Join to get product_id name
    INNER JOIN 
        partners n_partner ON t.name_id = n_partner.uuid  -- Join to get name_id name
    LEFT JOIN 
        company_assignments ca ON p_partner.uuid = ca.partner_id  -- Join to get partner's company
    LEFT JOIN 
        companies c ON ca.company_id = c.company_id  -- Join to get company details
    WHERE 
        (t.product_id = '$partnerId' OR t.name_id = '$partnerId')  -- Filter by partner_id (as product_id or name_id)
        AND t.timestamp > '$transaction->timestamp'  -- Additional filter condition

    ORDER BY 
        t.timestamp DESC
";




        // Execute the query
        $subsequentTransactions = DB::select($sql);




        $lastClosingBalances = [
            'product' => $transaction->product_closing_balance,
            'name' => $transaction->name_closing_balance,
        ];



foreach ($subsequentTransactions as $subTransaction) {
    // Calculate opening balances
    $productOpeningBalance = $lastClosingBalances['product'];
    $nameOpeningBalance = $lastClosingBalances['name'];

    // Determine if the transaction is credit or debit
    if ($subTransaction->coins > 0) { 
        // Credit: Add coins to product, subtract from name
        $productClosingBalance = $productOpeningBalance + $subTransaction->coins;
        $nameClosingBalance = $nameOpeningBalance - $subTransaction->coins;
    } else {
        // Debit: Subtract coins from product, add to name
        $productClosingBalance = $productOpeningBalance + $subTransaction->coins; // coins is negative here
        $nameClosingBalance = $nameOpeningBalance - $subTransaction->coins; // subtracting negative equals adding
    }

    // Update the transaction using raw SQL
    DB::table('transactions')
        ->where('transaction_id', $subTransaction->transaction_id)
        ->update([
            'product_opening_balance' => $productOpeningBalance,
            'name_opening_balance' => $nameOpeningBalance,
            'product_closing_balance' => $productClosingBalance,
            'name_closing_balance' => $nameClosingBalance,
        ]);

    // Update last closing balances for the next iteration
    $lastClosingBalances['product'] = $productClosingBalance;
    $lastClosingBalances['name'] = $nameClosingBalance;
}


    });

    return response()->json(['success' => true, 'message' => 'Transaction and subsequent balances updated successfully']);
}





public function getPartnersByCompany($companyId)
{
   $partners = DB::table('partners as p')
                ->join('company_assignments as ca', 'ca.partner_id', '=', 'p.uuid')
                ->select('p.uuid as id', 'p.name', 'p.balance')
                ->where('p.still_active',1)
                ->where('ca.company_id', $companyId)
                ->orderBy('p.still_active', 'DESC')
                ->get();

                 return response()->json($partners); 
}


    // ============ REAL-TIME JSON API ENDPOINTS ============

    public function api_backups()
    {
        $Backup = DB::table('backups')->orderBy('timestamp', 'desc')->get();
        $data = [];
        $sn = 1;
        foreach ($Backup as $backup) {
            $data[] = [
                'sn' => $sn++,
                'data' => Carbon::createFromTimestamp($backup->timestamp)->format('Y-m-d H:i:s'),
                'id' => $backup->id,
            ];
        }
        return response()->json(['data' => $data]);
    }

    public function api_partners()
    {
        $partners = DB::table('partners')
            ->leftJoin('company_assignments', 'company_assignments.partner_id', '=', 'partners.uuid')
            ->leftJoin('companies', 'company_assignments.company_id', '=', 'companies.company_id')
            ->select('partners.*', 'partners.name as partner_name', 'companies.name as company_name')
            ->orderBy('partners.id', 'desc')
            ->get();
        $data = [];
        $sn = 1;
        foreach ($partners as $partner) {
            $data[] = [
                'sn' => $sn++,
                'name' => $partner->name,
                'company_name' => $partner->company_name ?? '',
                'balance' => $partner->balance,
                'still_active' => $partner->still_active == 1 ? 'Active' : 'Not Active',
                'still_active_raw' => $partner->still_active,
                'id' => $partner->id,
                'uuid' => $partner->uuid,
            ];
        }
        return response()->json(['data' => $data]);
    }

    public function api_companies()
    {
        $companies = Company::orderBy('id', 'desc')->get();
        $data = [];
        $sn = 1;
        foreach ($companies as $company) {
            $data[] = [
                'sn' => $sn++,
                'name' => $company->name,
                'still_active' => $company->still_active == 1 ? 'Active' : 'Not Active',
                'still_active_raw' => $company->still_active,
                'created_at' => $company->created_at ? $company->created_at->format('Y-m-d H:i:s') : '',
                'id' => $company->id,
            ];
        }
        return response()->json(['data' => $data]);
    }

    public function api_transactions()
    {
        // Build lookup arrays to avoid slow UUID JOINs
        $partnerNames = DB::table('partners')->pluck('name', 'uuid')->toArray();
        $partnerCompany = DB::table('company_assignments')
            ->leftJoin('companies', 'company_assignments.company_id', '=', 'companies.company_id')
            ->pluck('companies.name', 'company_assignments.partner_id')
            ->toArray();
        $partnerCompanyId = DB::table('company_assignments')
            ->pluck('company_id', 'partner_id')
            ->toArray();

        $transactions = DB::table('transactions')->orderBy('timestamp', 'desc')->get();
        $data = [];
        $sn = 1;
        foreach ($transactions as $t) {
            $data[] = [
                'sn' => $sn++,
                'transaction_id' => $t->transaction_id,
                'company_name' => $partnerCompany[$t->product_id] ?? '',
                'name_id_name' => $partnerNames[$t->name_id] ?? '',
                'product_id_name' => $partnerNames[$t->product_id] ?? '',
                'coins' => $t->coins,
                'rate' => $t->rate,
                'remarks' => $t->remarks ?? '',
                'product_opening_balance' => $t->product_opening_balance,
                'product_closing_balance' => $t->product_closing_balance,
                'name_opening_balance' => $t->name_opening_balance,
                'name_closing_balance' => $t->name_closing_balance,
                'created_at' => Carbon::createFromTimestamp($t->timestamp)->format('Y-m-d H:i:s'),
                'modified' => $t->modified == 1 ? 'Yes' : 'No',
                'deleted' => $t->deleted == 1 ? 'Yes' : 'No',
                'name_id' => $t->name_id,
                'product_id' => $t->product_id,
                'company_id' => $partnerCompanyId[$t->product_id] ?? '',
            ];
        }
        return response()->json(['data' => $data]);
    }

    public function api_company_assignments()
    {
        $records = DB::table('company_assignments')
            ->leftJoin('partners', 'company_assignments.partner_id', '=', 'partners.uuid')
            ->leftJoin('companies', 'company_assignments.company_id', '=', 'companies.company_id')
            ->select('company_assignments.*', 'partners.name as partner_name', 'companies.name as company_name')
            ->orderBy('company_assignments.id', 'desc')
            ->get();
        $data = [];
        $sn = 1;
        foreach ($records as $r) {
            $data[] = [
                'sn' => $sn++,
                'partner_name' => $r->partner_name ?? '',
                'company_name' => $r->company_name ?? '',
                'created_at' => date('d-m-Y H:i:s', $r->timestamp),
                'id' => $r->id,
            ];
        }
        return response()->json(['data' => $data]);
    }

    public function api_user_company_access()
    {
        $records = UserCompanyAccess::with('user', 'company')->orderBy('id', 'desc')->get();
        $data = [];
        $sn = 1;
        foreach ($records as $r) {
            $data[] = [
                'sn' => $sn++,
                'user_name' => $r->user ? $r->user->name : '',
                'company_name' => $r->company ? $r->company->name : '',
                'access_level' => $r->access_level,
                'id' => $r->id,
            ];
        }
        return response()->json(['data' => $data]);
    }

    public function api_users()
    {
        $users = DB::table('users')->orderBy('id', 'desc')->get();
        $data = [];
        $sn = 1;
        foreach ($users as $user) {
            // Compute role string
            $role = 'None';
            if (!empty($user->is_superadmin)) $role = 'Super Admin';
            elseif (!empty($user->is_admin)) $role = 'Admin';
            elseif (!empty($user->is_employee)) $role = 'Employee';
            elseif (!empty($user->is_manager)) $role = 'Manager';

            $data[] = [
                'sn' => $sn++,
                'user_id' => $user->user_id ?? '',
                'name' => $user->name ?? '',
                'username' => $user->username ?? '',
                'phone' => $user->phone ?? '',
                'email' => $user->email ?? '',
                'country' => $user->country ?? '',
                'country_code' => $user->country_code ?? '',
                'otp_auth_enabled' => $user->otp_auth_enabled ?? 0,
                'has_admin_priviledges' => $user->has_admin_priviledges ?? 0,
                'role' => $role,
                'created_at' => $user->created_at ?? '',
                'updated_at' => $user->updated_at ?? '',
                'companies_acess' => $user->companies_acess ?? 0,
                'employee_tab' => $user->employee_tab ?? 0,
                'backup_tab' => $user->backup_tab ?? 0,
                'is_superadmin' => $user->is_superadmin ?? 0,
                'id' => $user->id,
            ];
        }
        return response()->json(['data' => $data]);
    }


    public function dashboardHome()
    {
        return view("admin.dashboard_home");
    }

    public function dashboardStats()
    {
        $stats = [
            "users" => \App\Models\User::count(),
            "companies" => \DB::table("companies")->count(),
            "partners" => \DB::table("partners")->count(),
            "transactions" => \DB::table("transactions")->where("deleted", 0)->count(),
            "backups" => \DB::table("backups")->count(),
            "recent_transactions" => \DB::table("transactions")
                ->where("deleted", 0)
                ->orderBy("id", "desc")
                ->limit(10)
                ->get()
                ->map(function($t) {
                    $partner = \DB::table("partners")->where("partner_id", $t->name_id)->first();
                    $company = \DB::table("companies")->where("company_id", $t->product_id)->first();
                    return [
                        "id" => $t->id,
                        "partner" => $partner->name ?? $t->name_id,
                        "company" => $company->name ?? $t->product_id,
                        "coins" => $t->coins ?? 0,
                        "rate" => $t->rate ?? 0,
                        "amount" => floatval($t->coins ?? 0) * floatval($t->rate ?? 0),
                        "date" => $t->timestamp ?? "",
                    ];
                }),
            "recent_backups" => \DB::table("backups")
                ->orderBy("id", "desc")
                ->limit(5)
                ->get(),
        ];
        return response()->json($stats);
    }

    

}
