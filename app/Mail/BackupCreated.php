<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class BackupCreated extends Mailable
{
    use Queueable, SerializesModels;

    public $backupFilePath;

    /**
     * Create a new message instance.
     *
     * @param string $backupFilePath
     */
    public function __construct($backupFilePath)
    {
        $this->backupFilePath = $backupFilePath;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->view('emails.backup')
                    ->subject('Backup Created Successfully')
                    ->attach($this->backupFilePath);
    }
}
