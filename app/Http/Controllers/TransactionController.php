<?php
// app/Http/Controllers/TransactionController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Partner;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Exception;

require base_path('vendor_pdf/autoload.php');
use Mpdf\Mpdf;
use Illuminate\Http\JsonResponse;
use App\Models\UserCompanyAccess;
use Illuminate\Support\Facades\Auth;
use App\Models\Company;
use Illuminate\Support\Facades\Response; // For using Response::json

class TransactionController extends Controller
{



public function get_remarks(Request $request)
{
    // Get the company_id from the query parameters
    $company_id = $request->query('companyID');

    // Fetch the partner IDs for the given company_id
    $partners = DB::table('company_assignments')
                  ->where('company_id', $company_id)
                  ->pluck('partner_id')
                  ->toArray();

    // Fetch the 'remarks' column for transactions where 'partner_id' is in either 'name_id' or 'product_id'
    $remarks = Transaction::where(function ($query) use ($partners) {
                            $query->whereIn('name_id', $partners)
                                  ->orWhereIn('product_id', $partners);
                          })
                          ->pluck('remarks')
                          ->toArray();

    // Return the data as JSON
    return response()->json($remarks);
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


    // Store previous name_id and product_id
    $prevNameId = $transaction->name_id;
    $prevProductId = $transaction->product_id;

 $this->update($request,$transaction->id);
 $this->updateBalances($request);

$this->calculateBalance($prevNameId, $request);
$this->calculateBalance($prevProductId, $request);




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






public function update(Request $request, $id)
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


public function generateTransactionReport(Request $request)
{
    // Validate incoming request parameters
    $validated = $request->validate([
        'partner_id' => 'required|string',
        'user_id' => 'required|string',
    ]);

    $partnerId = $validated['partner_id'];
    $userId = $validated['user_id'];

    // Modified SQL query
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
                WHEN t.product_id = '$partnerId' AND t.coins > 0 THEN t.coins * t.rate
                WHEN t.name_id = '$partnerId' AND t.coins < 0 THEN ABS(t.coins * t.rate)
                WHEN t.product_id = '$partnerId' AND t.coins < 0 THEN NULL
                ELSE 0 
            END AS credit,  
            CASE 
                WHEN t.name_id = '$partnerId' AND t.coins > 0 THEN ABS(t.coins * t.rate)  
                WHEN t.product_id = '$partnerId' AND t.coins < 0 THEN ABS(t.coins * t.rate)
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
            t.timestamp ASC;
    ";

    $transactions = DB::select($sql);

    // if (empty($transactions)) {
    //     return response()->json(['error' => 'No transactions found for the specified partner.'], 404);
    // }

    // Calculate running balance
    $runningBalance = 0;
    foreach ($transactions as $transaction) {
        if (!empty($transaction->deleted) && $transaction->deleted == 1) {
            $transaction->calculatedBalance = $runningBalance;
        } else {
            $transactionAmount = ($transaction->coins ?? 0) * ($transaction->rate ?? 0);
            $runningBalance += $transactionAmount;
            $transaction->calculatedBalance = $runningBalance;
        }

        // Round off credit, debit, and calculated balance to integers
        $transaction->credit = round($transaction->credit ?? 0);
        $transaction->debit = round($transaction->debit ?? 0);
        $transaction->calculatedBalance = round($transaction->calculatedBalance ?? 0);
    }

    $transactions = array_reverse($transactions);

    $partner = Partner::findByUuid($partnerId);
    $partnerName = $partner ? $partner->name : $partnerId;

    // Get the closing balance
    $closingBalance = reset($transactions)->calculatedBalance ?? 0;

    $mpdf = new \Mpdf\Mpdf(['mode' => 'utf-8', 'format' => 'A4-L']); 

    $mpdf->SetTitle('Entries for User ' . $partnerName); 

    // Define color for closing balance
    $closingBalanceColor = $closingBalance < 0 ? 'red' : 'blue'; 
    $html = '<div style="text-align: right; margin-bottom: 10px;"> 
                <strong>Date: ' . date('d/m/Y h:i:sa') . '</strong> 
             </div>
             <h1 style="text-align: center;">Entries for User ' . htmlspecialchars($partnerName) . '</h1>
             <div style="text-align: right; margin-bottom: 10px;">
                <strong>Closing Balance: <span style="color: ' . $closingBalanceColor . ';">' . number_format($closingBalance, 0) . '</span></strong>
             </div>
             <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
             <thead>
                <tr>
                    <th style="border: 1px solid black; padding: 5px;">S/N</th>
                    <th style="border: 1px solid black; padding: 5px;">Date</th>
                    <th style="border: 1px solid black; padding: 5px;">Name</th>
                    <th style="border: 1px solid black; padding: 5px;">Remarks</th>
                    <th style="border: 1px solid black; padding: 5px;">Coins</th>
                    <th style="border: 1px solid black; padding: 5px;">Rate</th>
                    <th style="border: 1px solid black; padding: 5px;">Credit</th>
                    <th style="border: 1px solid black; padding: 5px;">Debit</th>
                    <th style="border: 1px solid black; padding: 5px;">Balance</th>
                    <th style="border: 1px solid black; padding: 5px;">Status</th>
                </tr>
             </thead>
             <tbody>';
    
    $sn = 1;
    foreach ($transactions as $transaction) { 
        $productOrNameId = $transaction->product_id !== $partnerId ? $transaction->product_id_name : $transaction->name_id_name;
        $rowClass = ''; 
        if (!empty($transaction->credit)) {
            $rowClass = 'background-color: #fff3cd;';
        } elseif (!empty($transaction->debit)) {
            $rowClass = 'background-color: #f8d7da;';
        }
        if ($transaction->deleted) {
            $rowClass = 'background-color: #FF5722;';
        } elseif ($transaction->modified) {
            $rowClass = 'background-color: #d1ecf1;';
        }

        $status = !is_null($transaction->deleted) && $transaction->deleted != 0 ? 'Deleted' : (!is_null($transaction->modified) && $transaction->modified != 0 ? 'Modified' : '');

        $html .= '
            <tr style="' . $rowClass . '">
                <td style="border: 1px solid black; padding: 5px;">' . $sn++ . '</td>
                <td style="border: 1px solid black; padding: 5px;">' . date('d/m/Y h:i:sa', $transaction->timestamp) . '</td>
                <td style="border: 1px solid black; padding: 5px;">' . htmlspecialchars($productOrNameId) . '</td>
                <td style="border: 1px solid black; padding: 5px;">' . htmlspecialchars($transaction->remarks) . '</td>
                <td style="border: 1px solid black; padding: 5px;">' . number_format($transaction->coins) . '</td>
                <td style="border: 1px solid black; padding: 5px;">' . number_format($transaction->rate, 3) . '</td>
                <td style="border: 1px solid black; padding: 5px;">' . number_format($transaction->credit, 0) . '</td>
                <td style="border: 1px solid black; padding: 5px;">' . number_format($transaction->debit, 0) . '</td>
                <td style="border: 1px solid black; padding: 5px;">' . number_format($transaction->calculatedBalance, 0) . '</td>
                <td style="border: 1px solid black; padding: 5px;">' . $status . '</td>
            </tr>';
    }

    $html .= '</tbody></table>';

    $mpdf->WriteHTML($html);
    $filename = 'transactions_' . preg_replace('/\s+/', '_', $partnerName) . '.pdf';
    $mpdf->Output($filename, 'D');
    exit;
}






public function delete(Request $request)
{
    $transactionId = $request->input('transaction_id');
    
    // Find the transaction to be deleted
    $transaction = Transaction::where('transaction_id', $transactionId)->first();
    
    // Check if transaction exists and if it is already marked as deleted
    if ($transaction) {
        if ($transaction->deleted == 1) {
            return response()->json(['success' => false, 'message' => 'Transaction is already deleted.']);
        }
        
        try {
            // Fetch the related partner records for both product_id and name_id
            $partnerProduct = Partner::findByUuid($transaction->product_id);
            $partnerName = Partner::findByUuid($transaction->name_id);

            if (!$partnerProduct || !$partnerName) {
                return response()->json(['error' => 'Associated partner(s) not found.'], 404);
            }

            // Reverse the closing balance changes made by this transaction
            $productClosingBalance = $partnerProduct->balance - ($transaction->coins * $transaction->rate);
            $nameClosingBalance = $transaction->coins > 0
                ? $partnerName->balance + ($transaction->coins * $transaction->rate)
                : $partnerName->balance - abs($transaction->coins * $transaction->rate);

            // Update the balances temporarily after reversing the transaction
            $partnerProduct->balance = $productClosingBalance;
            $partnerName->balance = $nameClosingBalance;
            $partnerProduct->save();
            $partnerName->save();

            // Mark the transaction as deleted
            $transaction->deleted = 1;
            $transaction->modified = 0;
            $transaction->save();




$this->calculateBalance($transaction->product_id, $request);
    $this->calculateBalance($transaction->name_id, $request);




            return response()->json(['success' => true, 'message' => 'Transaction deleted and balances updated successfully!']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred while updating balances: ' . $e->getMessage()], 500);
        }
    }

    return response()->json(['success' => false, 'message' => 'Transaction not found.']);
}




public function restore(Request $request)
{
    $transactionId = $request->input('transaction_id');
    
    // Find the transaction to be deleted
    $transaction = Transaction::where('transaction_id', $transactionId)->first();
    
    // Check if transaction exists and if it is already marked as deleted
    if ($transaction) {
        if ($transaction->deleted == 0) {
            return response()->json(['error' => false, 'message' => 'Transaction Not deleted Yet.']);
        }
        
        try {
            // Fetch the related partner records for both product_id and name_id
            $partnerProduct = Partner::findByUuid($transaction->product_id);
            $partnerName = Partner::findByUuid($transaction->name_id);

            if (!$partnerProduct || !$partnerName) {
                return response()->json(['error' => 'Associated partner(s) not found.'], 404);
            }

            // Reverse the closing balance changes made by this transaction
            $productClosingBalance = $partnerProduct->balance + ($transaction->coins * $transaction->rate);
            $nameClosingBalance = $transaction->coins > 0
                ? $partnerName->balance + ($transaction->coins * $transaction->rate)
                : $partnerName->balance - abs($transaction->coins * $transaction->rate);

            // Update the balances temporarily after reversing the transaction
            $partnerProduct->balance = $productClosingBalance;
            $partnerName->balance = $nameClosingBalance;
            $partnerProduct->save();
            $partnerName->save();

            // Mark the transaction as deleted
            $transaction->deleted = 0;
            $transaction->modified = 0;
            $transaction->save();




$this->calculateBalance($transaction->product_id, $request);
    $this->calculateBalance($transaction->name_id, $request);




            return response()->json(['success' => true, 'message' => 'Transaction Restored and balances updated successfully!']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred while updating balances: ' . $e->getMessage()], 500);
        }
    }

    return response()->json(['success' => false, 'message' => 'Transaction not found.']);
}



public function delete_parmanent(Request $request)
{
    $transactionId = $request->input('transaction_id');
    
    // Find the transaction to be deleted
    $transaction = Transaction::where('transaction_id', $transactionId)->first();
    
    // Check if transaction exists and if it is already marked as deleted
    if ($transaction) {
        if ($transaction->deleted == 1) {
            $transaction->delete();
            return response()->json(['success' => true, 'message' => 'Transaction Parmanently deleted !']);
        }
        
        try {
            // Fetch the related partner records for both product_id and name_id
            $partnerProduct = Partner::findByUuid($transaction->product_id);
            $partnerName = Partner::findByUuid($transaction->name_id);

            if (!$partnerProduct || !$partnerName) {
                return response()->json(['error' => 'Associated partner(s) not found.'], 404);
            }

            // Reverse the closing balance changes made by this transaction
            $productClosingBalance = $partnerProduct->balance - ($transaction->coins * $transaction->rate);
            $nameClosingBalance = $transaction->coins > 0
                ? $partnerName->balance + ($transaction->coins * $transaction->rate)
                : $partnerName->balance - abs($transaction->coins * $transaction->rate);

            // Update the balances temporarily after reversing the transaction
            $partnerProduct->balance = $productClosingBalance;
            $partnerName->balance = $nameClosingBalance;
            $partnerProduct->save();
            $partnerName->save();

            // Mark the transaction as deleted
            $transaction->deleted = 1;
            $transaction->modified = 0;
            $transaction->save();




$this->calculateBalance($transaction->product_id, $request);
    $this->calculateBalance($transaction->name_id, $request);


$transaction->delete();

            return response()->json(['success' => true, 'message' => 'Transaction Parmanently deleted and balances updated successfully!']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred while updating balances: ' . $e->getMessage()], 500);
        }
    }

    return response()->json(['success' => false, 'message' => 'Transaction not found.']);
}








public function get_partners(Request $request)
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
            return view('partners',compact('response'));

        } catch (Exception $e) {
            // Catch any exceptions and return an error message
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }


}




}
