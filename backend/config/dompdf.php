<?php

return [
    'isRemoteEnabled' => true,               
    'chroot'          => public_path(),    
    'defaultFont'     => 'vazirmatn',

    'font_dir'        => storage_path('fonts'),    
    'font_cache'      => storage_path('fonts'),

    'font' => [
        'vazirmatn' => [
            'R' => public_path('fonts/vazirmatn/Vazirmatn-Regular.ttf'),
            'B' => public_path('fonts/vazirmatn/Vazirmatn-Bold.ttf'),
        ],
        'dejavu sans' => [
            'R' => base_path('vendor/dompdf/dompdf/lib/fonts/DejaVuSans.ttf'),
            'B' => base_path('vendor/dompdf/dompdf/lib/fonts/DejaVuSans-Bold.ttf'),
        ],
    ],
];
