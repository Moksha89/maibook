
    public function dashboardStats()
    {
        $partners_total = \DB::table("partners")->count();
        $partners_active = \DB::table("partners")->where("still_active", 1)->count();
        $partners_inactive = $partners_total - $partners_active;
        $companies_total = \DB::table("companies")->count();
        $companies_active = \DB::table("companies")->where("still_active", 1)->count();
        $transactions_total = \DB::table("transactions")->count();
        $transactions_today = \DB::table("transactions")->whereDate("created_at", today())->count();
        $daily = \DB::table("transactions")
            ->select(\DB::raw("DATE(created_at) as date"), \DB::raw("COUNT(*) as count"))
            ->where("created_at", ">=", now()->subDays(30))
            ->groupBy("date")
            ->orderBy("date")
            ->get();
        $users_total = \DB::table("users")->count();
        $users_admins = \DB::table("users")->whereIn("role", ["SuperAdmin", "Admin"])->count();
        $recent_transactions = \DB::table("transactions")
            ->leftJoin("partners as p1", "transactions.product_id", "=", "p1.id")
            ->leftJoin("partners as p2", "transactions.name_id", "=", "p2.id")
            ->select("transactions.*", "p1.name as product_name", "p2.name as name_name")
            ->orderBy("transactions.created_at", "desc")
            ->limit(10)
            ->get()
            ->map(function($t) {
                return [
                    "id" => $t->transaction_id ?? $t->id ?? 0,
                    "product_name" => $t->product_name ?? "Unknown",
                    "name_name" => $t->name_name ?? "Unknown",
                    "coins" => $t->coins ?? 0,
                    "rate" => $t->rate ?? 0,
                    "date" => isset($t->created_at) ? \Carbon\Carbon::parse($t->created_at)->diffForHumans() : "",
                ];
            });
        $recent_backups = \DB::table("backups")
            ->orderBy("id", "desc")
            ->limit(5)
            ->get()
            ->map(function($b) {
                return [
                    "id" => $b->id,
                    "date" => isset($b->created_at) ? \Carbon\Carbon::parse($b->created_at)->diffForHumans() : "N/A",
                ];
            });
        return response()->json([
            "partners" => ["total" => $partners_total, "active" => $partners_active, "inactive" => $partners_inactive],
            "companies" => ["total" => $companies_total, "active" => $companies_active],
            "transactions" => ["total" => $transactions_total, "today" => $transactions_today, "daily" => $daily],
            "users" => ["total" => $users_total, "admins" => $users_admins],
            "recent_transactions" => $recent_transactions,
            "recent_backups" => $recent_backups,
        ]);
    }


    public function dashboardHome()
    {
        return view("admin.dashboard_home");
    }

}
