<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    // Specify the table if it's not the plural of the model name
    protected $table = 'transactions';

    // Define the primary key if it's not 'id'
    protected $primaryKey = 'id';

    // Disable timestamps if you're not using created_at and updated_at
    public $timestamps = false;

    // Specify the fillable fields
    protected $fillable = [
        'transaction_id',          // Transaction ID
        'name_id',                 // Sender partner ID
        'product_id',              // Receiver partner ID
        'coins',                   // Amount of coins
        'rate',                    // Rate associated with the transaction
        'remarks',                 // Any remarks about the transaction
        'product_opening_balance', // Opening balance of the product
        'product_closing_balance', // Closing balance of the product
        'name_opening_balance',    // Opening balance for the sender
        'name_closing_balance',    // Closing balance for the sender
        'timestamp',               // Timestamp of the transaction
        'modified',                // To keep track of modifications, if necessary
        'deleted',                 // Soft delete flag (if applicable)
    ];



    
}

