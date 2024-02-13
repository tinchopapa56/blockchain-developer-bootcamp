import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";

interface TxReceipt {
  to: string;
  from: string;
  contractAddress: string | null;
  transactionIndex: number;
  gasUsed: { value: string }; // Este campo parece ser un objeto que contiene el valor de gas usado
  logsBloom: string;
  blockHash: string;
  transactionHash: string;
  logs: any[]; // Los logs generados por la transacción
  confirmations: number;
  cumulativeGasUsed: { value: string }; // La cantidad total de gas utilizada
  effectiveGasPrice: { value: string }; // Precio efectivo del gas
  status: number; // Estado de la transacción (éxito o falla)
  type: number;
  byzantium: boolean;
  events: any[]; // Eventos generados por la transacción
}

const formatEth = (amount: number): BigNumber => {
  return ethers.utils.parseUnits(amount.toString(), 18);
}
const nullOrInvalidAddress = '0x0000000000000000000000000000000000000000'

describe("Token", () => {
  let token: any = null, accounts: any = null, deployer: any = null, receiver: any = null,
    exchange: any = null;


  const name = "Dapp University"
  const symbol = "DAPP"
  const decimals = "18"
  const totalSupply = 2000000

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token")

    token = await Token.deploy(name, symbol, totalSupply)
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    receiver = accounts[1]
    exchange = accounts[2]
  })

  describe("Deployment", () => {
    it("has a name", async () => {
      const name = await token.name()
      expect(name).to.equal(name)
    })
    it("has a symbol", async () => {
      const symbol = await token.symbol()
      expect(symbol).to.equal(symbol)
      expect(symbol).to.not.equal("DAPP NOT")
    })
    it("has correct decimals", async () => {
      const decimals = await token.decimals()
      expect(decimals).to.equal(18)
    })
    it("has correct total supply", async () => {
      const supply = await token.totalSupply()
      const val = formatEth(2000000)
      expect(supply).to.equal(val)
      expect(supply).not.to.equal(formatEth(3000000)) // = "3000000000000000000000000"
    })
    it("assigns 0.1 total supply to deployer", async () => {
      const deployerBalance = await token.balanceOf(deployer.address)
      const val = formatEth(200000)
      expect(deployerBalance).to.equal(val)
    })
  });

  describe("Functions", () => {

    describe("Token Transfer", () => {
      let amount: BigNumber, toAddress: string, res: TxReceipt;

      beforeEach(async () => {
        amount = formatEth(50000)
        toAddress = receiver.address

        const transfer = await token.connect(deployer).transfer(toAddress, amount)
        res = await transfer.wait()
      })

      describe("Success", () => {

        it("transfers token balances", async () => {
          const to_balance = await token.balanceOf(toAddress)
          const from_balance = await token.balanceOf(deployer.address)

          expect(to_balance).to.equal(formatEth(50000))
          expect(from_balance).to.equal(formatEth(150000))
        })
        it("emits event", async () => {

          const firstEvent = res.events[0]
          expect(firstEvent.event).to.equal("Transfer")

          const args = firstEvent.args
          expect(args.from).to.equal(deployer.address);
          expect(args.to).to.equal(toAddress);
          expect(args.value).to.equal(amount);

        })
      })
      describe("Fails", () => {
        it("deployer has insufficient balance", async () => {
          const invalidAmount = "1000000000000000000"
          const trasnferERROR = await token.connect(deployer).transfer(toAddress, invalidAmount)
          expect(trasnferERROR).to.be.reverted;
          expect(trasnferERROR).to.be.revertedWith("Insufficient balance");
        })
        it("invalid recipient address", async () => {
          const err = await token.connect(deployer).transfer("0x0000000000000000000000000000000000000001", amount)
          expect(err).to.be.reverted;
          expect(err).to.be.revertedWith("Invalid recipient address");
        })
      })

    })
    describe("Aprove tokens", () => {
      let amount2: any, res: TxReceipt, tx: any;

      beforeEach(async () => {
        amount2 = formatEth(100)
        tx = await token.connect(deployer).approve(exchange.address, amount2)
        res = await tx.wait()
      })

      describe("Success", () => {
        it("allocates allowance for delegated token spending", async () => {
          expect(
            await token.allowance(deployer.address, exchange.address)
          ).to.equal(amount2)

        })
        it("emits Approval event", async () => {
          const e = res.events[0]
          expect(e.event).to.equal("Approval")

          const args = e.args
          expect(args.owner).to.equal(deployer.address);
          expect(args.spender).to.equal(exchange.address);
          expect(args.value).to.equal(amount2);
        })

      })

      describe("Fails", () => {
        it("rejects invalid spender", async () => {
          const err = token.connect(deployer).approve(nullOrInvalidAddress)
          expect(err).to.be.revertedWith("Invalid spender");
          // await expect(token.connect(deployer).approve('0x0000000000000000000000000000000000000000', amount2)).to.be.reverted

        })
      })
    })
    describe("Delegated Token transfers (transferFrom)", () => {
      let amount: any, tx, result: any;

      //add 1000 in allowance for deployer ON exchange list
      beforeEach(async () => {
        amount = formatEth(15000)
        tx = await token.connect(deployer).approve(exchange.address, amount)
        result = await tx.wait()
      })

      describe("Success", () => {
        beforeEach(async () => {
          amount = formatEth(10000)
          tx = await token.connect(exchange).transferFrom(deployer.address, receiver.address, amount)
          result = await tx.wait()
        })
        it("Transfers token balances", async () => {
          const amountDeployerSHOULDHave = formatEth(190000)
          const amountReceiverSHOULDHave = amount

          expect(await token.balanceOf(deployer.address)).to.equal(amountDeployerSHOULDHave)
          expect(await token.balanceOf(receiver.address)).to.equal(amountReceiverSHOULDHave)
        })
        it("resets the allowance", async () => {
          const changedAllowance = await token.allowance(deployer.address, exchange.address)
          expect(changedAllowance).to.be.equal(formatEth(5000));
        })
        it("emits event", async () => {

          const firstEvent = result.events[0]
          expect(firstEvent.event).to.equal("Transfer")

          const args = firstEvent.args
          expect(args.from).to.equal(deployer.address);
          expect(args.to).to.equal(receiver.address);
          expect(args.value).to.equal(amount);

        })

      })
      describe("Fails", () => {
        
        it("invalid HIGH amount", async () => {
          const invalidAmount = formatEth(10000000)
          await expect(token.connect(exchange).transferFrom(deployer.address, receiver.address, invalidAmount)).to.be.reverted
        })

      })

    })
  })


})

/*
describe.skip("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const lockedAmount = ONE_GWEI;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

    return { lock, unlockTime, lockedAmount, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

      expect(await lock.unlockTime()).to.equal(unlockTime);
    });

    it("Should set the right owner", async function () {
      const { lock, owner } = await loadFixture(deployOneYearLockFixture);

      expect(await lock.owner()).to.equal(owner.address);
    });

    it("Should receive and store the funds to lock", async function () {
      const { lock, lockedAmount } = await loadFixture(
        deployOneYearLockFixture
      );

      expect(await ethers.provider.getBalance(lock.address)).to.equal(
        lockedAmount
      );
    });

    it("Should fail if the unlockTime is not in the future", async function () {
      // We don't use the fixture here because we want a different deployment
      const latestTime = await time.latest();
      const Lock = await ethers.getContractFactory("Lock");
      await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
        "Unlock time should be in the future"
      );
    });
  });

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { lock } = await loadFixture(deployOneYearLockFixture);

        await expect(lock.withdraw()).to.be.revertedWith(
          "You can't withdraw yet"
        );
      });

      it("Should revert with the right error if called from another account", async function () {
        const { lock, unlockTime, otherAccount } = await loadFixture(
          deployOneYearLockFixture
        );

        // We can increase the time in Hardhat Network
        await time.increaseTo(unlockTime);

        // We use lock.connect() to send a transaction from another account
        await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
          "You aren't the owner"
        );
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { lock, unlockTime } = await loadFixture(
          deployOneYearLockFixture
        );

        // Transactions are sent using the first signer by default
        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).not.to.be.reverted;
      });
    });

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { lock, unlockTime, lockedAmount } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw())
          .to.emit(lock, "Withdrawal")
          .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).to.changeEtherBalances(
          [owner, lock],
          [lockedAmount, -lockedAmount]
        );
      });
    });
  });
});*/