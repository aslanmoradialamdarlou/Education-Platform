<?php
// app/Services/Media/SpotPlayerService.php
namespace App\Services\Media;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class SpotPlayerService
{
    private Client $http;
    private string $api;
    private string $level;
    private string $endpoint;

    public function __construct()
    {
        $this->http = new Client(['verify'=>false, 'timeout'=>20]);
        $this->api = config('services.spotplayer.api', env('SPOTPLAYER_API_KEY'));
        $this->level = config('services.spotplayer.level', env('SPOTPLAYER_LEVEL', '-1'));
        $this->endpoint = config('services.spotplayer.endpoint', env('SPOTPLAYER_ENDPOINT'));
    }

    public function createLicense(array $payload): array
    {
        $headers = [
            'Content-Type' => 'application/json',
            '$API'   => $this->api,
            '$LEVEL' => $this->level,
        ];

        $res = $this->http->post($this->endpoint, [
            'headers' => $headers,
            'json'    => $payload,
        ]);

        $data = json_decode((string)$res->getBody(), true);
        if (!is_array($data)) {
            Log::error('SpotPlayer invalid response', ['body'=>(string)$res->getBody()]);
            throw new \RuntimeException('Invalid response from SpotPlayer');
        }
        if (isset($data['ex'])) {
            throw new \RuntimeException($data['ex']['msg'] ?? 'SpotPlayer error');
        }
        return $data; // ['_id'=>..., 'key'=>..., 'url'=>...]
    }

    public function editLicense(string $licenseId, array $payload): array
    {
        $headers = [
            'Content-Type' => 'application/json',
            '$API'   => $this->api,
            '$LEVEL' => $this->level,
        ];

        $endpoint = rtrim($this->endpoint,'/').'/'.$licenseId;
        $res = $this->http->post($endpoint, [
            'headers' => $headers,
            'json'    => $payload,
        ]);

        $data = json_decode((string)$res->getBody(), true);
        if (!is_array($data)) {
            throw new \RuntimeException('Invalid response from SpotPlayer');
        }
        if (isset($data['ex'])) {
            throw new \RuntimeException($data['ex']['msg'] ?? 'SpotPlayer error');
        }
        return $data;
    }
}
