<?php

namespace App\Services;

final class WhatsappResult
{
    public function __construct(
        public readonly bool $successful,
        public readonly array $data = [],
        public readonly ?string $message = null,
        public readonly int $status = 200,
    ) {
    }

    public static function success(array $data, int $status = 200): self
    {
        return new self(true, $data, null, $status);
    }

    public static function failure(string $message, int $status = 503): self
    {
        return new self(false, [], $message, $status);
    }
}
