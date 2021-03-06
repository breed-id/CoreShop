<?php
/**
 * CoreShop.
 *
 * LICENSE
 *
 * This source file is subject to the GNU General Public License version 3 (GPLv3)
 * For the full copyright and license information, please view the LICENSE.md and gpl-3.0.txt
 * files that are distributed with this source code.
 *
 * @copyright  Copyright (c) 2015-2016 Dominik Pfaffenbauer (https://www.pfaffenbauer.at)
 * @license    https://www.coreshop.org/license     GNU General Public License version 3 (GPLv3)
 */

namespace CoreShop\Controller\Action;

use CoreShop\Controller\Action;
use CoreShop\Exception\UnsupportedException;
use CoreShop\Model\Order;
use Pimcore\Model\Document;
use CoreShop\Model\Plugin\Payment as CorePayment;

/**
 * Class Payment
 * @package CoreShop\Controller\Action
 */
class Payment extends Action
{
    /**
     * Determines if the action is triggered by an internal-forward
     *
     * @var bool
     */
    public static $isActionForward = false;

    /**
     * Payment Module.
     *
     * @var CorePayment
     */
    protected $module;

    /**
     * @var bool
     */
    protected $opc = false;

    /**
     * @var string
     */
    protected $checkoutController = 'checkout';


    /**
     * Init Controller.
     */
    public function init()
    {
        parent::init();

        $this->view->document = $this->document = Document::getByPath('/'.$this->language.'/shop');
        $this->view->module = $this->getModule();

        $pathsToAdd = [
            CORESHOP_TEMPLATE_BASE.'/scripts/'.strtolower($this->getModule()->getIdentifier()),
            CORESHOP_TEMPLATE_PATH.'/scripts/'.strtolower($this->getModule()->getIdentifier()),
            PIMCORE_WEBSITE_PATH.'/views/scripts/'.strtolower($this->getModule()->getIdentifier())
        ];

        if(self::$isActionForward) {
            $this->view->setScriptPath(
                array_merge(
                    $this->view->getScriptPaths(),
                    $pathsToAdd
                )
            );
        }
        else {
            $this->view->setScriptPath(
                array_merge(
                    $pathsToAdd,
                    $this->view->getScriptPaths()
                )
            );
        }

        if($this->getParam("opc", false)) {
            $this->opc = true;
            $this->checkoutController = "checkout-opc";

            $this->disableLayout();
        }
    }

    /**
     * get Payment module.
     *
     * @return CorePayment
     */
    public function getModule()
    {
        if (is_null($this->module)) {
            $this->module = \CoreShop::getPaymentProvider($this->getRequest()->getModuleName());
        }

        return $this->module;
    }

    /**
     * Payment Action.
     *
     * @throws UnsupportedException
     */
    public function paymentAction()
    {
        throw new UnsupportedException('This Method has to implemented by the Plugin Controller');
    }

    /**
     * Validate Action.
     */
    public function validateAction()
    {
        if(!$this->opc) {
            $this->coreShopForward("validate", $this->checkoutController, "CoreShop", array("paymentViewScript" => $this->getViewScript()));
        }
    }

    /**
     * Confirmation Action.
     */
    public function confirmationAction()
    {
        $this->view->order = $this->session->order;

        $forwardParams = array(
            "module" => $this->getModule()
        );

        if ($this->view->order instanceof Order) {
            $forwardParams['order'] = $this->view->order;
            $forwardParams['paymentViewScript'] = $this->getViewScript();

            $this->coreShopForward("confirmation", $this->checkoutController, "CoreShop", $forwardParams);
        } else {
            $this->coreShopForward("error", $this->checkoutController, "CoreShop", $forwardParams);
        }
    }
}
