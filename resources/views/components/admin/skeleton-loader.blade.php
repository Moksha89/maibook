@props([
    'type' => 'table',
    'rows' => 5,
    'cols' => 4,
])

@if($type === 'table')
<div class="premium-skeleton premium-skeleton--table" aria-hidden="true" role="status" aria-label="Loading...">
    <div class="premium-skeleton__header">
        @for($i = 0; $i < $cols; $i++)
        <div class="premium-skeleton__cell premium-skeleton__pulse"></div>
        @endfor
    </div>
    @for($r = 0; $r < $rows; $r++)
    <div class="premium-skeleton__row">
        @for($c = 0; $c < $cols; $c++)
        <div class="premium-skeleton__cell premium-skeleton__pulse"></div>
        @endfor
    </div>
    @endfor
</div>
@elseif($type === 'card')
<div class="premium-skeleton premium-skeleton--card" aria-hidden="true">
    <div class="premium-skeleton__block premium-skeleton__pulse" style="height: 120px;"></div>
    <div class="premium-skeleton__line premium-skeleton__pulse" style="width: 60%;"></div>
    <div class="premium-skeleton__line premium-skeleton__pulse" style="width: 80%;"></div>
</div>
@elseif($type === 'stat')
<div class="premium-skeleton premium-skeleton--stat" aria-hidden="true">
    <div class="premium-skeleton__line premium-skeleton__pulse" style="width: 40%; height: 14px;"></div>
    <div class="premium-skeleton__line premium-skeleton__pulse" style="width: 60%; height: 28px; margin-top: 8px;"></div>
</div>
@endif
