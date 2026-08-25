<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BackupEmail extends Model
{
    use HasFactory;

    protected $table = 'backup_emails';
      // Disable default timestamps
    public $timestamps = false;

    protected $fillable = ['email', 'date_time'];
}
