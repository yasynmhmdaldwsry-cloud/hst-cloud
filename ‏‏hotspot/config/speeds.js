
if (typeof window.defaultSpeedsConfig === 'undefined') {
    window.defaultSpeedsConfig = [

        {upload: "256K", download: "1024K", name: "سرعة عادية 1 ميجا"},
        {upload: "128K", download: "512K", name: "سرعة منخفضة 512K"},
        {upload: "512K", download: "2048K", name: "سرعة متوسطة 2 ميجا"},
        {upload: "1024K", download: "4096K", name: "سرعة عالية 4 ميجا"},
        {upload: "2048K", download: "8192K", name: "سرعة عالية 8 ميجا"}
    ];

    window.speed16MConfig = {upload: "4M", download: "16M", name: "سرعة عالية جدا 16 ميجا", className: "hidden"};
}

if (typeof window.speedsConfig === 'undefined') {
    window.speedsConfig = window.defaultSpeedsConfig;
}

if (typeof speedDomainSuffix === 'undefined') {
    var speedDomainSuffix = "|noalnooah|all|vpn|no|no";
}

