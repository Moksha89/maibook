@extends('admin.layouts.admin')
@section('content')

<div class="premium-page-header">
    <div class="premium-page-header__left">
        <h4 class="premium-page-header__title">Dashboard</h4>
        <p class="premium-page-header__subtitle">Overview of your business metrics</p>
    </div>
</div>

<!-- Stat Cards Row -->
<div class="premium-dashboard-grid" id="dashboardStats">
    <!-- Skeleton loaders shown while loading -->
    <div class="premium-stat-card" id="statPartners">
        <div class="premium-stat-card__content">
            <p class="premium-stat-card__label">Total Partners</p>
            <h3 class="premium-stat-card__value" id="statPartnersValue">
                <span class="premium-skeleton__pulse" style="display:inline-block;width:60px;height:28px;border-radius:4px;"></span>
            </h3>
            <p class="premium-stat-card__subtitle" id="statPartnersActive"></p>
        </div>
        <div class="premium-stat-card__icon premium-stat-card__icon--primary">
            <i class="fa fa-handshake-o"></i>
        </div>
    </div>

    <div class="premium-stat-card" id="statCompanies">
        <div class="premium-stat-card__content">
            <p class="premium-stat-card__label">Total Companies</p>
            <h3 class="premium-stat-card__value" id="statCompaniesValue">
                <span class="premium-skeleton__pulse" style="display:inline-block;width:60px;height:28px;border-radius:4px;"></span>
            </h3>
            <p class="premium-stat-card__subtitle" id="statCompaniesActive"></p>
        </div>
        <div class="premium-stat-card__icon premium-stat-card__icon--success">
            <i class="fa fa-building"></i>
        </div>
    </div>

    <div class="premium-stat-card" id="statTransactions">
        <div class="premium-stat-card__content">
            <p class="premium-stat-card__label">Total Transactions</p>
            <h3 class="premium-stat-card__value" id="statTransactionsValue">
                <span class="premium-skeleton__pulse" style="display:inline-block;width:60px;height:28px;border-radius:4px;"></span>
            </h3>
            <p class="premium-stat-card__subtitle" id="statTransactionsRecent"></p>
        </div>
        <div class="premium-stat-card__icon premium-stat-card__icon--warning">
            <i class="fa fa-credit-card"></i>
        </div>
    </div>

    <div class="premium-stat-card" id="statUsers">
        <div class="premium-stat-card__content">
            <p class="premium-stat-card__label">Total Users</p>
            <h3 class="premium-stat-card__value" id="statUsersValue">
                <span class="premium-skeleton__pulse" style="display:inline-block;width:60px;height:28px;border-radius:4px;"></span>
            </h3>
            <p class="premium-stat-card__subtitle" id="statUsersAdmin"></p>
        </div>
        <div class="premium-stat-card__icon premium-stat-card__icon--info">
            <i class="fa fa-users"></i>
        </div>
    </div>
</div>

<!-- Charts Row -->
<div class="row" style="margin-top: var(--space-lg, 24px);">
    <div class="col-lg-8 col-md-12" style="margin-bottom: var(--space-lg, 24px);">
        <div class="premium-card">
            <div class="premium-card__header">
                <h5 class="premium-card__title">Transaction Activity</h5>
                <p class="premium-card__subtitle">Last 30 days</p>
            </div>
            <div class="premium-card__body">
                <div id="transactionChart" class="premium-chart-container" style="min-height: 300px;"></div>
            </div>
        </div>
    </div>
    <div class="col-lg-4 col-md-12" style="margin-bottom: var(--space-lg, 24px);">
        <div class="premium-card">
            <div class="premium-card__header">
                <h5 class="premium-card__title">Partners by Status</h5>
            </div>
            <div class="premium-card__body">
                <div id="partnerStatusChart" class="premium-chart-container" style="min-height: 300px;"></div>
            </div>
        </div>
    </div>
</div>

<!-- Recent Activity & Backups Row -->
<div class="row">
    <div class="col-lg-6 col-md-12" style="margin-bottom: var(--space-lg, 24px);">
        <div class="premium-card">
            <div class="premium-card__header">
                <h5 class="premium-card__title">Recent Transactions</h5>
            </div>
            <div class="premium-card__body premium-card__body--no-padding">
                <div class="premium-activity-feed" id="recentTransactions">
                    <div class="premium-empty-state" style="padding: 32px;">
                        <div class="premium-empty-state__icon"><i class="fa fa-spinner fa-spin"></i></div>
                        <h5 class="premium-empty-state__title">Loading...</h5>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-lg-6 col-md-12" style="margin-bottom: var(--space-lg, 24px);">
        <div class="premium-card">
            <div class="premium-card__header">
                <h5 class="premium-card__title">Recent Backups</h5>
            </div>
            <div class="premium-card__body premium-card__body--no-padding">
                <div class="premium-activity-feed" id="recentBackups">
                    <div class="premium-empty-state" style="padding: 32px;">
                        <div class="premium-empty-state__icon"><i class="fa fa-spinner fa-spin"></i></div>
                        <h5 class="premium-empty-state__title">Loading...</h5>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

@endsection

@section('scripts')
@parent

<script>
$(document).ready(function() {
    // Load dashboard stats
    function loadDashboardStats() {
        $.ajax({
            url: '/api/dashboard-stats',
            method: 'GET',
            success: function(data) {
                // Partners
                $('#statPartnersValue').text(data.partners || 0);
                $('#statPartnersActive').text('');

                // Companies
                $('#statCompaniesValue').text(data.companies || 0);
                $('#statCompaniesActive').text('');

                // Transactions
                var txCount = data.transactions || 0;
                $('#statTransactionsValue').text(txCount.toLocaleString());
                $('#statTransactionsRecent').text('');

                // Users
                $('#statUsersValue').text(data.users || 0);
                $('#statUsersAdmin').text('');

                // Render charts
                renderTransactionChart([]);
                renderPartnerStatusChart(data.partners || 0, 0);

                // Render recent transactions
                renderRecentTransactions(data.recent_transactions || []);
                renderRecentBackups(data.recent_backups || []);
            },
            error: function() {
                $('#statPartnersValue').text('--');
                $('#statCompaniesValue').text('--');
                $('#statTransactionsValue').text('--');
                $('#statUsersValue').text('--');
                $('#recentTransactions').html('<div class="premium-empty-state" style="padding:32px;"><div class="premium-empty-state__icon"><i class="fa fa-exclamation-triangle"></i></div><h5 class="premium-empty-state__title">Failed to load data</h5><p class="premium-empty-state__message">Please refresh the page to try again.</p></div>');
                $('#recentBackups').html($('#recentTransactions').html());
            }
        });
    }

    function renderTransactionChart(daily) {
        if (typeof ApexCharts === 'undefined' || !document.querySelector('#transactionChart')) return;
        var categories = daily.map(function(d) { return d.date; });
        var values = daily.map(function(d) { return d.count; });

        var options = {
            series: [{ name: 'Transactions', data: values }],
            chart: { type: 'area', height: 300, toolbar: { show: false },
                     foreColor: 'var(--text-secondary, #64748b)',
                     background: 'transparent' },
            colors: ['#e8652e'],
            fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
            stroke: { curve: 'smooth', width: 2 },
            xaxis: { categories: categories, labels: { rotate: -45, style: { fontSize: '10px' } } },
            yaxis: { labels: { formatter: function(v) { return Math.round(v); } } },
            tooltip: { theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light' },
            grid: { borderColor: 'var(--border-primary, #e2e8f0)', strokeDashArray: 4 },
            dataLabels: { enabled: false }
        };

        var chart = new ApexCharts(document.querySelector('#transactionChart'), options);
        chart.render();
    }

    function renderPartnerStatusChart(active, inactive) {
        if (typeof ApexCharts === 'undefined' || !document.querySelector('#partnerStatusChart')) return;
        if (active === 0 && inactive === 0) {
            $('#partnerStatusChart').html('<div class="premium-empty-state" style="padding:32px;"><div class="premium-empty-state__icon"><i class="fa fa-pie-chart"></i></div><h5 class="premium-empty-state__title">No partner data</h5></div>');
            return;
        }
        var options = {
            series: [active, inactive],
            chart: { type: 'donut', height: 300, background: 'transparent' },
            labels: ['Active', 'Inactive'],
            colors: ['#22c55e', '#ef4444'],
            legend: { position: 'bottom', labels: { colors: 'var(--text-secondary, #64748b)' } },
            plotOptions: { pie: { donut: { size: '60%',
                labels: { show: true, total: { show: true, label: 'Total', color: 'var(--text-secondary, #64748b)' } }
            } } },
            stroke: { width: 0 },
            dataLabels: { enabled: true, style: { fontSize: '13px' } }
        };

        var chart = new ApexCharts(document.querySelector('#partnerStatusChart'), options);
        chart.render();
    }

    function renderRecentTransactions(transactions) {
        var html = '';
        if (!transactions.length) {
            html = '<div class="premium-empty-state" style="padding:32px;"><div class="premium-empty-state__icon"><i class="fa fa-credit-card"></i></div><h5 class="premium-empty-state__title">No recent transactions</h5><p class="premium-empty-state__message">Transactions will appear here once created.</p></div>';
        } else {
            transactions.forEach(function(t) {
                var coinClass = t.coins >= 0 ? 'trend--up' : 'trend--down';
                var coinSign = t.coins >= 0 ? '+' : '';
                html += '<div class="premium-activity-feed__item">';
                html += '<div class="premium-activity-feed__icon"><i class="fa fa-exchange"></i></div>';
                html += '<div class="premium-activity-feed__content">';
                html += '<div class="premium-activity-feed__title">' + (t.company || 'Unknown') + ' &rarr; ' + (t.partner || 'Unknown') + '</div>';
                html += '<div class="premium-activity-feed__meta">';
                html += '<span class="' + coinClass + '">' + coinSign + t.coins + ' coins</span>';
                html += ' &middot; Rate: ' + t.rate;
                html += ' &middot; ' + t.date;
                html += '</div></div></div>';
            });
        }
        $('#recentTransactions').html(html);
    }

    function renderRecentBackups(backups) {
        var html = '';
        if (!backups.length) {
            html = '<div class="premium-empty-state" style="padding:32px;"><div class="premium-empty-state__icon"><i class="fa fa-cloud-upload"></i></div><h5 class="premium-empty-state__title">No recent backups</h5><p class="premium-empty-state__message">Create a backup from the Backups page.</p></div>';
        } else {
            backups.forEach(function(b) {
                html += '<div class="premium-activity-feed__item">';
                html += '<div class="premium-activity-feed__icon"><i class="fa fa-cloud-upload"></i></div>';
                html += '<div class="premium-activity-feed__content">';
                html += '<div class="premium-activity-feed__title">Backup #' + b.id + '</div>';
                html += '<div class="premium-activity-feed__meta">' + b.date + '</div>';
                html += '</div></div>';
            });
        }
        $('#recentBackups').html(html);
    }

    // Initial load
    loadDashboardStats();

    // Refresh every 30 seconds
    setInterval(loadDashboardStats, 30000);
});
</script>

@endsection
