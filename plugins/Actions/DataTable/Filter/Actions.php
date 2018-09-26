<?php
/**
 * Piwik - free/libre analytics platform
 *
 * @link http://piwik.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 *
 */
namespace Piwik\Plugins\Actions\DataTable\Filter;

use Piwik\Common;
use Piwik\Config;
use Piwik\DataTable\BaseFilter;
use Piwik\DataTable\Row;
use Piwik\DataTable;

class Actions extends BaseFilter
{
    private $isPageTitleType;
    /**
     * Constructor.
     *
     * @param DataTable $table The table to eventually filter.
     * @param bool $isPageTitleType Whether we are handling page title or regular URL
     */
    public function __construct($table, $isPageTitleType)
    {
        parent::__construct($table);
        $this->isPageTitleType = $isPageTitleType;
    }

    /**
     * @param DataTable $table
     */
    public function filter($table)
    {
        $isFlattening = Common::getRequestVar('flat', 0);

        $table->filter(function (DataTable $dataTable) use ($isFlattening) {
            $defaultActionName = Config::getInstance()->General['action_default_name'];

            // for BC, we read the old style delimiter first (see #1067)
            $actionDelimiter = @Config::getInstance()->General['action_category_delimiter'];
            if (empty($actionDelimiter)) {
                if ($this->isPageTitleType) {
                    $actionDelimiter = Config::getInstance()->General['action_title_category_delimiter'];
                } else {
                    $actionDelimiter = Config::getInstance()->General['action_url_category_delimiter'];
                }
            }

            foreach ($dataTable->getRows() as $row) {
                $url = $row->getMetadata('url');
                if ($url) {
                    // encoding the value since Segment will decode the condition AND the value. without encoding here, segments
                    // that for URLs w/ plus signs will decode to whitespace, and select no data.
                    $row->setMetadata('segmentValue', urlencode($url));
                }

                // remove the default action name 'index' in the end of flattened urls and prepend $actionDelimiter
                if ($isFlattening) {
                    $label = $row->getColumn('label');
                    $stringToSearch = $actionDelimiter.$defaultActionName;
                    if (substr($label, -strlen($stringToSearch)) == $stringToSearch) {
                        $label = substr($label, 0, -strlen($defaultActionName));
                        $label = rtrim($label, $actionDelimiter) . $actionDelimiter;
                        $row->setColumn('label', $label);
                    }
                    $dataTable->setLabelsHaveChanged();
                }
            }
        });

        if (!$isFlattening) { // SafeDecodeLabel is not called subtables are requested during flattening
            $table->queueFilter('GroupBy', array('label', function ($label) {
                return urlencode($label); // to make up for SafeDecodeLabel later
            }));
        }

        foreach ($table->getRowsWithoutSummaryRow() as $row) {
            $subtable = $row->getSubtable();
            if ($subtable) {
                $this->filter($subtable);
            }
        }
    }
}