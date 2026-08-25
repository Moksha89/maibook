<?php
namespace App\Services;

use App\Models\Partner;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Exception;

class TransactionService
{
    public function processTransaction($nameId, $productId, $coins, $rate, $remarks)
    {
        DB::beginTransaction();

        try {
            // Fetch sender's balance
            $sender = Partner::where('uuid',$nameId)->first();
            $receiver = Partner::where('uuid',$productId)->first();

            $senderBalance = $sender->balance;
            $receiverBalance = $receiver->balance;

            // Calculate new balances
            $newSenderBalance = $senderBalance - $coins;
            $newReceiverBalance = $receiverBalance + $coins;

            // Update sender's balance
            $sender->update(['balance' => $newSenderBalance]);

            // Update receiver's balance
            $receiver->update(['balance' => $newReceiverBalance]);

            // Create transaction record
            Transaction::create([
                'transaction_id' => uniqid('txn_'),
                'name_id' => $nameId,
                'product_id' => $productId,
                'coins' => $coins,
                'rate' => $rate,
                'remarks' => $remarks,
                'product_opening_balance' => $receiverBalance,
                'product_closing_balance' => $newReceiverBalance,
                'name_opening_balance' => $senderBalance,
                'name_closing_balance' => $newSenderBalance,
                'timestamp' => now()->toDateTimeString(),
            ]);

            DB::commit();

            return ['success' => true, 'message' => 'Transaction processed successfully.'];
        } catch (Exception $e) {
            DB::rollBack();
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
}
