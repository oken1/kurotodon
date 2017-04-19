<div class='twd rarity{$rarity}'>
<span class='twd_rarity'>{$rarity_name}</span>
<span class='twd_icon'><img src='{$icon}'></span>
<span class='twd_name'>{$screen_name}</span>
<span class='twd_time{if !$best} non_best{/if}'>TIME: <span class='twd_num{if $best} best{/if}'>{$time}</span></span>
{if $dt}<span class='twd_date'>{$dt}</span>{/if}
<div class='icon-close twd_del tooltip' tooltip='(i18n_0223)' index='{$index}'></div>
</div>
