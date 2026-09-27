import ExpoModulesCore
import GameKit

public class GameCenterModule: Module {
  private var dismissDelegate: GameCenterDismissDelegate?

  public func definition() -> ModuleDefinition {
    Name("GameCenter")

    AsyncFunction("authenticate") { (promise: Promise) in
      let player = GKLocalPlayer.local
      if player.isAuthenticated {
        promise.resolve(Self.playerInfo(player))
        return
      }
      var settled = false
      player.authenticateHandler = { [weak self] viewController, _ in
        if let viewController = viewController {
          self?.appContext?.utilities?.currentViewController()?.present(viewController, animated: true)
          return
        }
        // authenticateHandler は状態変化のたびに呼ばれるため、Promise は初回だけ解決する
        if settled { return }
        settled = true
        promise.resolve(Self.playerInfo(player))
      }
    }.runOnQueue(.main)

    AsyncFunction("submitScore") { (score: Int, leaderboardIds: [String], promise: Promise) in
      let player = GKLocalPlayer.local
      guard player.isAuthenticated else {
        promise.reject("E_NOT_AUTHENTICATED", "Game Center not authenticated")
        return
      }
      GKLeaderboard.submitScore(score, context: 0, player: player, leaderboardIDs: leaderboardIds) { error in
        if let error = error {
          promise.reject("E_SUBMIT_FAILED", error.localizedDescription)
        } else {
          promise.resolve()
        }
      }
    }

    AsyncFunction("showLeaderboard") { (leaderboardId: String?, promise: Promise) in
      guard GKLocalPlayer.local.isAuthenticated else {
        promise.reject("E_NOT_AUTHENTICATED", "Game Center not authenticated")
        return
      }
      guard let presenter = self.appContext?.utilities?.currentViewController() else {
        promise.reject("E_NO_VIEW_CONTROLLER", "No view controller to present from")
        return
      }
      let vc: GKGameCenterViewController
      if let id = leaderboardId {
        vc = GKGameCenterViewController(leaderboardID: id, playerScope: .global, timeScope: .allTime)
      } else {
        vc = GKGameCenterViewController(state: .leaderboards)
      }
      let delegate = GameCenterDismissDelegate { [weak self] in
        self?.dismissDelegate = nil
      }
      self.dismissDelegate = delegate
      vc.gameCenterDelegate = delegate
      presenter.present(vc, animated: true)
      promise.resolve()
    }.runOnQueue(.main)
  }

  private static func playerInfo(_ player: GKLocalPlayer) -> [String: Any] {
    var info: [String: Any] = ["isAuthenticated": player.isAuthenticated]
    if player.isAuthenticated {
      info["displayName"] = player.displayName
    }
    return info
  }
}

final class GameCenterDismissDelegate: NSObject, GKGameCenterControllerDelegate {
  private let onDismiss: () -> Void

  init(onDismiss: @escaping () -> Void) {
    self.onDismiss = onDismiss
  }

  func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
    gameCenterViewController.dismiss(animated: true)
    onDismiss()
  }
}
