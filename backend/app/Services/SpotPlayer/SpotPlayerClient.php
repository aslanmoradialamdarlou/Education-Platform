<?php

namespace App\Services\SpotPlayer;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\RequestException;

class SpotPlayerClient
{
    protected string $base;
    protected string $endpoint;
    protected string $api;
    protected string $level;
    protected int $timeout;
    protected int $connectTimeout;

    public function __construct()
    {
        $this->base           = rtrim(config('spotplayer.base_url'), '/');
        $this->endpoint       = ltrim(config('spotplayer.endpoint'), '/');
        $this->api            = config('spotplayer.api_key');
        $this->level          = (string) config('spotplayer.level', '-1');
        $this->timeout        = (int) config('spotplayer.timeout', 15);
        $this->connectTimeout = (int) config('spotplayer.connect_timeout', 5);
    }

    protected function http()
    {
        return Http::retry(0, 0) // ریتری شبکه‌ای را خودمان با Queue هندل می‌کنیم
        ->timeout($this->timeout)
            ->connectTimeout($this->connectTimeout)
            ->withHeaders([
                '$API'   => $this->api,
                '$LEVEL' => $this->level,
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ]);
    }

    /** ایجاد لایسنس جدید */
    public function createLicense(array $payload): array
    {
        $url = "{$this->base}/{$this->endpoint}";
        $res = $this->http()->post($url, $payload);

        // SpotPlayer در صورت خطا معمولا فیلد 'ex' برمی‌گرداند
        if ($res->failed()) {
            throw new RequestException($res);
        }
        $json = $res->json();

        if (is_array($json) && array_key_exists('ex', $json)) {
            $msg = is_array($json['ex']) ? ($json['ex']['msg'] ?? 'SpotPlayer error') : 'SpotPlayer error';
            throw new \RuntimeException($msg);
        }

        if (!is_array($json) || !isset($json['_id'], $json['key'], $json['url'])) {
            throw new \RuntimeException('Invalid SpotPlayer response.');
        }

        return $json; // ['_id'=>..., 'key'=>..., 'url'=>...]
    }

    /** ویرایش لایسنس (اختیاری برای آینده) */
    public function updateLicense(string $licenseId, array $payload): array
    {
        $url = "{$this->base}/{$this->endpoint}{$licenseId}";
        $res = $this->http()->post($url, $payload);
        if ($res->failed()) {
            throw new RequestException($res);
        }
        $json = $res->json();
        if (is_array($json) && array_key_exists('ex', $json)) {
            $msg = is_array($json['ex']) ? ($json['ex']['msg'] ?? 'SpotPlayer error') : 'SpotPlayer error';
            throw new \RuntimeException($msg);
        }
        return $json;
    }
}
